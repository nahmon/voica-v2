# Voicebox 배포 및 인프라 분석

> Voicebox(오픈소스 Voice AI Studio)를 Voica-v2 프로덕션 환경에 통합하기 위한 배포/인프라 분석

---

## 1. 배포 옵션 비교

### 옵션 개요

| 옵션 | 초기 비용 | 월 운영비 | 확장성 | 관리 부담 | 적합 시나리오 |
|------|----------|----------|--------|----------|--------------|
| Self-hosted GPU 서버 | 높음 ($2,000~$15,000) | 낮음 (전기+네트워크) | 제한적 | 높음 | 대량 트래픽, 예측 가능한 워크로드 |
| Cloud GPU (AWS/GCP) | 없음 | 중간~높음 | 높음 | 중간 | 안정적 트래픽, 빠른 스케일링 필요 |
| Serverless GPU (Modal/RunPod) | 없음 | 사용량 비례 | 매우 높음 | 낮음 | 불규칙 트래픽, 초기 스타트업 |
| Hybrid (CPU + GPU) | 낮음 | 낮음~중간 | 중간 | 중간 | 비용 최적화, 다양한 모델 혼용 |

### 1-1. Self-hosted GPU 서버

**장점:**
- 장기적으로 가장 낮은 비용 (GPU 감가상각 후)
- 데이터가 자체 서버에 보관 (GDPR 유리)
- 네트워크 레이턴시 최소화

**단점:**
- 높은 초기 투자비 (RTX 4090: ~$1,600, A100 80GB: ~$15,000)
- 하드웨어 장애 시 자체 대응 필요
- 스케일링에 물리적 제약

**GPU별 Voicebox 엔진 호환성:**

| GPU | VRAM | 지원 엔진 | 동시 생성 수 |
|-----|------|----------|-------------|
| RTX 4090 | 24GB | 모든 엔진 (Kokoro~TADA) | 2~4 |
| RTX 3090 | 24GB | 모든 엔진 | 2~3 |
| RTX 4070 Ti | 12GB | Kokoro, Chatterbox, F5-TTS | 1~2 |
| A100 80GB | 80GB | 모든 엔진 + 대규모 배치 | 8~16 |

### 1-2. Cloud GPU 인스턴스

**AWS:**

| 인스턴스 | GPU | VRAM | On-Demand ($/hr) | Spot ($/hr) | 월 비용 (On-Demand) |
|----------|-----|------|-------------------|-------------|---------------------|
| g5.xlarge | 1x A10G | 24GB | $1.006 | ~$0.35 | ~$724 |
| g5.2xlarge | 1x A10G | 24GB | $1.212 | ~$0.42 | ~$873 |
| g5.4xlarge | 1x A10G | 24GB | $1.624 | ~$0.56 | ~$1,169 |
| p4d.24xlarge | 8x A100 | 320GB | $32.77 | ~$12.00 | ~$23,594 |

**GCP:**

| 인스턴스 | GPU | VRAM | On-Demand ($/hr) | Spot ($/hr) | 월 비용 (On-Demand) |
|----------|-----|------|-------------------|-------------|---------------------|
| a2-highgpu-1g | 1x A100 | 40GB | $3.67 | ~$1.10 | ~$2,642 |
| a2-highgpu-8g | 8x A100 | 320GB | $29.39 | ~$8.82 | ~$21,161 |
| g2-standard-4 | 1x L4 | 24GB | $0.84 | ~$0.25 | ~$605 |

**추천:** 초기에는 AWS g5.xlarge 또는 GCP g2-standard-4 (A10G/L4, 24GB VRAM)로 시작. Voicebox의 모든 엔진을 구동 가능.

### 1-3. Serverless GPU

| 플랫폼 | GPU 옵션 | 가격 (A100 80GB, $/hr) | Cold Start | 과금 단위 | 특이사항 |
|--------|----------|----------------------|------------|----------|---------|
| **RunPod** | T4~H100 | $2.17 | <200ms (48%) | 초 단위 | Flex Worker (scale-to-zero) + Active Worker |
| **Modal** | T4~H100 | $3.95 | 2~4초 | 초 단위 | Python SDK, $30/월 무료 크레딧 |
| **Replicate** | A40~A100 | $5.04 | 5~15초 | 초 단위 | 커뮤니티 모델 라이브러리 |

**Serverless GPU 적합 조건:**
- 하루 TTS 생성 요청이 불규칙하거나 적은 경우 (< 수백 건/일)
- GPU idle 시간이 50% 이상일 것으로 예상되는 경우
- 빠른 프로토타이핑 및 MVP 단계

**추천:** RunPod Serverless가 가격 대비 성능과 cold start 면에서 최적. Flex Worker로 scale-to-zero 가능.

### 1-4. Hybrid 접근법

경량 모델(Kokoro, 82MB)은 CPU에서 구동하고, 고품질 모델(TADA, Chatterbox)만 GPU로 라우팅:

```
사용자 요청 → API Gateway → Model Router
                              ├── Kokoro (CPU, ~82MB) → 빠른 응답, 저비용
                              ├── F5-TTS (GPU, ~1.2GB) → 중간 품질
                              └── TADA (GPU, ~8GB) → 최고 품질
```

**장점:** CPU 인스턴스는 GPU 대비 5~10배 저렴. 대부분의 요청을 Kokoro로 처리하면 비용 대폭 절감.

---

## 2. Docker 배포

### 2-1. Docker Compose 구성 (GPU)

```yaml
# docker-compose.gpu.yml
version: "3.8"

services:
  voicebox:
    image: jamiepine/voicebox:cuda
    ports:
      - "17493:17493"
    volumes:
      - voicebox-models:/app/models
      - voicebox-output:/app/output
    environment:
      - VOICEBOX_HOST=0.0.0.0
      - VOICEBOX_PORT=17493
      - VOICEBOX_DEFAULT_ENGINE=kokoro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:17493/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  voicebox-models:
  voicebox-output:
```

### 2-2. NVIDIA Container Toolkit 설정

```bash
# NVIDIA Container Toolkit 설치 (Ubuntu/Debian)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 2-3. Docker 이미지 크기

| 이미지 태그 | 크기 | GPU 지원 |
|------------|------|---------|
| `jamiepine/voicebox:cpu` | ~3-4 GB | CPU only |
| `jamiepine/voicebox:cuda` | ~6-8 GB | NVIDIA CUDA |
| `jamiepine/voicebox:rocm` | ~7-9 GB | AMD ROCm |

---

## 3. 비용 분석

### 3-1. ElevenLabs API 비용

| 모델 | 가격 (1,000자) | 1분 음성 (~800자) | 1,000분 음성 |
|------|---------------|------------------|-------------|
| Flash/Turbo | $0.06 | $0.048 | $48 |
| Multilingual v2/v3 | $0.12 | $0.096 | $96 |
| Standard Voices | $0.30 | $0.24 | $240 |
| PVC (Professional) | $0.50 | $0.40 | $400 |

### 3-2. Self-hosted Voicebox 비용

**시나리오: AWS g5.xlarge (A10G, 24GB)**

| 항목 | 월 비용 |
|------|--------|
| EC2 On-Demand | $724 |
| EBS Storage (100GB) | $10 |
| 데이터 전송 (100GB) | $9 |
| **합계** | **~$743/월** |

**시나리오: RunPod Serverless (A10G)**

하루 평균 2시간 GPU 사용 가정:
- $0.40/hr × 2hr × 30일 = **$24/월** (T4)
- $0.76/hr × 2hr × 30일 = **$45.6/월** (A10G)

**시나리오: 전용 GPU 서버 (Hostkey RTX 4090)**
- 월 ~$409 (전용 서버 렌탈)

### 3-3. Break-even 분석

**ElevenLabs vs Self-hosted (AWS g5.xlarge, $743/월)**

| ElevenLabs 모델 | 분당 비용 | Break-even 분 수 | 하루 환산 |
|----------------|----------|-----------------|----------|
| Flash/Turbo | $0.048 | 15,479분/월 | ~516분/일 |
| Multilingual v2 | $0.096 | 7,740분/월 | ~258분/일 |
| Standard | $0.24 | 3,096분/월 | ~103분/일 |
| PVC | $0.40 | 1,858분/월 | ~62분/일 |

**ElevenLabs vs RunPod Serverless ($45.6/월, A10G 기준)**

| ElevenLabs 모델 | Break-even 분 수 |
|----------------|-----------------|
| Flash/Turbo | 950분/월 (~32분/일) |
| Multilingual v2 | 475분/월 (~16분/일) |
| Standard | 190분/월 (~6분/일) |

> **결론:** RunPod Serverless 기준, 하루 16~32분 이상 TTS를 생성하면 self-hosting이 유리.
> 고품질 모델(Standard/PVC) 사용 시 하루 6분 이상이면 이미 break-even.

### 3-4. 비용 최적화 전략

1. **Hybrid 모델 라우팅:** 80%의 요청을 Kokoro(CPU)로 처리, 20% 고품질만 GPU
2. **Spot/Preemptible 인스턴스:** AWS Spot으로 60~70% 절감 (중단 위험 있음)
3. **Scale-to-zero:** RunPod Flex Worker로 유휴 시간 비용 0
4. **Model Caching:** 자주 사용하는 모델만 메모리에 유지

---

## 4. 아키텍처 설계

### 4-1. 전체 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React SPA  │────▶│   Supabase   │     │   Supabase      │
│  (Frontend) │     │  Edge Func   │────▶│   Storage       │
└─────────────┘     └──────┬───────┘     │   (Audio CDN)   │
                           │             └─────────────────┘
                           │ REST API                ▲
                           ▼                         │ Upload
                    ┌──────────────┐          ┌──────┴────────┐
                    │  API Gateway │          │  Worker        │
                    │  (Kong/      │─────────▶│  (Voicebox     │
                    │   Nginx)     │  Job Q   │   Container)   │
                    └──────────────┘          └───────────────┘
                           │
                    ┌──────▼──────┐
                    │  Redis/     │
                    │  BullMQ     │
                    │  (Job Queue)│
                    └─────────────┘
```

### 4-2. API Gateway / Reverse Proxy

Nginx 또는 Kong을 사용하여 Voicebox API를 프록시:

```nginx
# nginx.conf
upstream voicebox {
    server voicebox:17493;
}

server {
    listen 443 ssl;
    server_name tts-api.voica.app;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=tts:10m rate=10r/m;

    location /api/tts/ {
        limit_req zone=tts burst=5;

        # Supabase JWT 검증
        auth_request /auth/verify;

        proxy_pass http://voicebox/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 긴 TTS 생성 대기
        proxy_read_timeout 120s;
    }

    location /auth/verify {
        internal;
        proxy_pass http://localhost:3001/verify;
    }
}
```

### 4-3. 인증 & Rate Limiting

```
클라이언트 요청 → Supabase Auth (JWT) → API Gateway 검증 → Voicebox
```

- **인증:** Supabase JWT를 API Gateway에서 검증. Voicebox 자체는 내부 네트워크에서만 접근.
- **Rate Limiting:** 사용자 플랜별 분당/일별 제한
  - Free: 10회/일
  - Pro: 100회/일
  - Enterprise: 무제한

### 4-4. Async Job Queue (BullMQ)

TTS 생성은 수 초~수십 초가 걸리므로 비동기 처리가 필수:

```
1. 클라이언트 → POST /api/tts/generate (text, engine, voice)
2. API → BullMQ에 job 추가 → job_id 반환
3. Worker → job 소비 → Voicebox API 호출 → 음성 생성
4. Worker → Supabase Storage에 업로드 → job 상태 업데이트
5. 클라이언트 → GET /api/tts/status/:job_id (polling 또는 WebSocket)
```

### 4-5. CDN (Audio 파일 서빙)

- **Supabase Storage** 사용: 자동 CDN, 퍼블릭/프라이빗 버킷 지원
- 생성된 오디오를 Supabase Storage에 업로드 → signed URL로 클라이언트에 전달
- TTL 설정으로 오래된 파일 자동 삭제

---

## 5. 확장성

### 5-1. 동시 TTS 생성 한계

| GPU | VRAM | Kokoro (82MB) | Chatterbox (~2GB) | TADA (~8GB) |
|-----|------|--------------|-------------------|-------------|
| A10G (24GB) | 24GB | ~20 동시 | ~8 동시 | ~2 동시 |
| RTX 4090 (24GB) | 24GB | ~20 동시 | ~8 동시 | ~2 동시 |
| A100 (80GB) | 80GB | ~50+ 동시 | ~30 동시 | ~8 동시 |

> 실제 동시 처리량은 텍스트 길이, 배치 크기, 모델 구현에 따라 달라짐.

### 5-2. 모델 Loading/Unloading 전략

```
Model Manager
├── Hot Pool: 자주 사용하는 모델 (Kokoro) → 항상 메모리에
├── Warm Pool: 가끔 사용하는 모델 (F5-TTS) → LRU 캐시, 5분 idle 후 unload
└── Cold Pool: 거의 사용 안 하는 모델 (TADA) → 요청 시 load (~10초)
```

- **LRU (Least Recently Used)** 정책으로 VRAM 관리
- 모델 로딩 시간: Kokoro ~1초, Chatterbox ~3초, TADA ~10초
- Preload 설정으로 서버 시작 시 기본 모델 로딩

### 5-3. Multi-instance Load Balancing

```
                    ┌─── Voicebox Worker 1 (GPU 0) ──── Kokoro + Chatterbox
Load Balancer ──────┤
  (Round-robin /    ├─── Voicebox Worker 2 (GPU 1) ──── Kokoro + F5-TTS
   Least-conn)     │
                    └─── Voicebox Worker 3 (CPU)   ──── Kokoro only
```

- **수평 확장:** Docker Swarm 또는 Kubernetes로 worker 수 조절
- **GPU별 특화:** 각 worker에 다른 모델 할당
- **Health Check:** `/health` 엔드포인트로 worker 상태 모니터링
- **Auto-scaling:** GPU 사용률 80% 이상 시 worker 추가

---

## 6. 보안

### 6-1. 음성 데이터 프라이버시

| 항목 | ElevenLabs (외부 API) | Self-hosted Voicebox |
|------|----------------------|---------------------|
| 데이터 위치 | ElevenLabs 서버 (미국) | 자체 서버/VPC |
| GDPR 준수 | DPA 필요 | 자체 통제 가능 |
| 음성 데이터 보존 | ElevenLabs 정책 따름 | 자체 삭제 정책 설정 |
| 음성 복제 데이터 | 제3자 서버에 저장 | 로컬 보관, 외부 전송 없음 |

**Self-hosted 장점:**
- 음성 복제 데이터가 외부로 나가지 않음
- GDPR Article 28 (processor 조항) 이슈 없음
- 한국 PIPA (개인정보보호법) 준수 용이

### 6-2. 네트워크 격리

```
┌─────────────── VPC ───────────────────┐
│                                       │
│  ┌── Public Subnet ──┐                │
│  │  API Gateway       │                │
│  │  (443 only)        │                │
│  └────────┬───────────┘                │
│           │                            │
│  ┌── Private Subnet ─┐                │
│  │  Voicebox Workers  │  ← 외부 접근 불가│
│  │  Redis/BullMQ      │                │
│  │  Model Storage     │                │
│  └────────────────────┘                │
└───────────────────────────────────────┘
```

- Voicebox 컨테이너는 **private subnet**에 배치
- API Gateway만 public 노출 (443 포트)
- Worker 간 통신은 내부 네트워크만 사용

### 6-3. API Key 관리

- Voicebox 내부 API는 키 없이 운영 (네트워크 격리로 보호)
- 외부 접근은 Supabase Auth JWT로 인증
- 관리자 API는 별도 API key + IP whitelist
- 모든 키는 환경 변수 또는 secret manager (AWS Secrets Manager, Vault)로 관리

---

## 7. 권장 배포 전략

### Phase 1: MVP (월 $25~50)

- **RunPod Serverless** (Flex Worker, A10G)
- Kokoro 엔진 기본, Chatterbox 옵션
- Supabase Edge Function에서 RunPod API 호출
- Scale-to-zero로 유휴 비용 없음

### Phase 2: Growth (월 $400~750)

- **전용 GPU 서버** (Hostkey RTX 4090, ~$409/월) 또는 **AWS g5.xlarge** (~$724/월)
- Docker Compose로 Voicebox + Redis + Nginx 배포
- BullMQ 기반 async job queue
- 모델 라우팅 (Kokoro CPU + 고품질 GPU)

### Phase 3: Scale (월 $1,500+)

- **Kubernetes** (EKS/GKE) + GPU node pool
- Multi-worker 로드밸런싱
- Auto-scaling (GPU 사용률 기반)
- 모델별 전용 worker 풀
- CDN + edge caching

---

## Sources

- [GPU Cloud Pricing 2026 — Spendark](https://spendark.com/blog/machine-learning-cloud-cost/)
- [GPU Cloud Pricing Comparison 2026 — Spheron](https://www.spheron.network/blog/gpu-cloud-pricing-comparison-2026/)
- [Cloud GPU Pricing Comparison — CloudZero](https://www.cloudzero.com/blog/cloud-gpu-pricing-comparison/)
- [RunPod Pricing](https://www.runpod.io/pricing)
- [RunPod Serverless Pricing Docs](https://docs.runpod.io/serverless/pricing)
- [Top Serverless GPU Clouds 2026 — RunPod](https://www.runpod.io/articles/guides/top-serverless-gpu-clouds)
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- [ElevenLabs Pricing Breakdown 2026 — Cekura](https://www.cekura.ai/blogs/elevenlabs-pricing)
- [Voicebox GitHub](https://github.com/jamiepine/voicebox)
- [Voicebox Docker Documentation](https://docs.voicebox.sh/overview/docker)
- [HOSTKEY GPU Servers](https://hostkey.com/dedicated-servers/rent-nvidia-servers/)
- [AWS EC2 G5 Instances](https://aws.amazon.com/ec2/instance-types/g5/)
- [GCP GPU Pricing](https://cloud.google.com/compute/gpus-pricing)
