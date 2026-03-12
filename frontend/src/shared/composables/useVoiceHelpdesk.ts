import { ref } from 'vue'
import type { SpeechRecognitionLike } from '../types/helpdesk'

export function useVoiceHelpdesk(onTranscript: (text: string) => Promise<void> | void) {
  const isListening = ref(false)
  const isSupported = ref(
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  )

  let recognition: SpeechRecognitionLike | null = null

  function start() {
    if (typeof window === 'undefined') {
      return
    }

    if (!isSupported.value || isListening.value) {
      return
    }

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!RecognitionCtor) {
      return
    }

    recognition = new RecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      isListening.value = true
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.onerror = () => {
      isListening.value = false
    }

    recognition.onresult = async (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim()

      if (!text) {
        return
      }

      await onTranscript(text)
    }

    recognition.start()
  }

  function stop() {
    recognition?.stop()
  }

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  return {
    isSupported,
    isListening,
    start,
    stop,
    speak,
  }
}
