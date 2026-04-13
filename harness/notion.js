// harness/notion.js
const API = 'https://api.notion.com/v1'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }
}

export async function postToNotion(instruction, resultUrl, content) {
  const res = await fetch(`${API}/pages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      parent: { page_id: process.env.NOTION_PAGE_ID },
      properties: {
        title: {
          title: [{ text: { content: instruction.slice(0, 100) } }]
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: `📎 결과 URL: ${resultUrl || '없음'}` } }]
          }
        },
        {
          object: 'block',
          type: 'divider',
          divider: {}
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: content.slice(0, 1900) } }]
          }
        }
      ]
    })
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return `https://notion.so/${data.id.replace(/-/g, '')}`
}
