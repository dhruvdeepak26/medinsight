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
      max_tokens: 1024,
      system:
        'You are a knowledgeable health advisor. Provide clear, well-structured health reports based on the metrics given. Always include a brief disclaimer that your analysis is for informational purposes only and is not a substitute for professional medical advice.',
      messages: [
        {
          role: 'user',
          content: `Please provide a comprehensive health report for the following metrics:\n\n${metricLines.join('\n')}\n\nInclude: an overall health assessment, key observations for each metric, any concerning patterns, and practical lifestyle recommendations. Format with clear sections.`,
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
