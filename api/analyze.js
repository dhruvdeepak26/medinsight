import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
    return
  }

  const healthData = req.body

  const metricLines = []
  if (healthData.age)          metricLines.push(`Age: ${healthData.age} years`)
  if (healthData.weight)       metricLines.push(`Weight: ${healthData.weight} kg`)
  if (healthData.height)       metricLines.push(`Height: ${healthData.height} cm`)
  if (healthData.bmi)          metricLines.push(`BMI: ${healthData.bmi} kg/m²`)
  if (healthData.heartRate)    metricLines.push(`Resting Heart Rate: ${healthData.heartRate} bpm`)
  if (healthData.bloodPressure) metricLines.push(`Blood Pressure: ${healthData.bloodPressure} mmHg`)
  if (healthData.steps)        metricLines.push(`Daily Steps: ${healthData.steps}`)
  if (healthData.sleep)        metricLines.push(`Sleep Duration: ${healthData.sleep} hours`)
  if (healthData.spo2)         metricLines.push(`Blood Oxygen (SpO2): ${healthData.spo2}%`)
  if (healthData.cholesterol)  metricLines.push(`Total Cholesterol: ${healthData.cholesterol} mg/dL`)
  if (healthData.ldl)          metricLines.push(`LDL Cholesterol: ${healthData.ldl} mg/dL`)
  if (healthData.hdl)          metricLines.push(`HDL Cholesterol: ${healthData.hdl} mg/dL`)
  if (healthData.glucose)      metricLines.push(`Fasting Blood Glucose: ${healthData.glucose} mg/dL`)

  if (metricLines.length === 0) {
    res.status(400).json({ error: 'No health data provided' })
    return
  }

  const client = new Anthropic({ apiKey })

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: `You are a health analysis assistant. Analyze the provided health metrics and return ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON. Use this exact schema:
{
  "overall": {
    "status": "excellent|good|fair|poor",
    "label": "e.g. Good Health",
    "summary": "2-3 sentence overall assessment"
  },
  "sections": [
    {
      "name": "Demographics|Cardiovascular|Lifestyle|Blood Panel",
      "metrics": [
        {
          "name": "metric name",
          "value": "value with unit",
          "status": "normal|warning|critical",
          "range": "normal range string",
          "note": "brief 1-sentence clinical note"
        }
      ]
    }
  ],
  "recommendations": ["up to 5 concise actionable recommendations"]
}
Only include sections and metrics for which data was provided. Keep notes under 15 words.`,
      messages: [
        {
          role: 'user',
          content: `Analyze these health metrics and return the JSON report:\n\n${metricLines.join('\n')}`,
        },
      ],
    })

    stream.on('text', (text) => {
      res.write(text)
    })

    await stream.finalMessage()
    res.end()
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate health report' })
    } else {
      res.end()
    }
  }
}
