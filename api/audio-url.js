const supabase = (await import("@supabase/supabase-js")).createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { response_id } = req.query;
  if (!response_id) return res.status(400).json({ error: "response_id required" });

  const { data: response, error } = await supabase
    .from("responses")
    .select("id, audio_url")
    .eq("id", response_id)
    .single();

  if (error || !response) return res.status(404).json({ error: "Response not found" });
  if (!response.audio_url) return res.status(404).json({ error: "No audio for this response" });

  // Extract storage path from signed URL
  const match = response.audio_url.match(/\/audio-responses\/(.+?)(\?|$)/);
  if (!match) return res.status(400).json({ error: "Could not extract storage path" });

  const storagePath = decodeURIComponent(match[1]);
  const { data: signedData, error: signError } = await supabase.storage
    .from("audio-responses")
    .createSignedUrl(storagePath, 31536000);

  if (signError || !signedData) return res.status(500).json({ error: "Failed to create signed URL" });

  return res.status(200).json({ audio_url: signedData.signedUrl });
}
