<script setup lang="ts">
import { supabase } from '@/shared/lib/supabase'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

type TotpFactor = {
  id: string
  friendly_name?: string | null
  status?: string
}

type EnrollResponse = {
  id: string
  friendlyName?: string | null
  uri?: string | null
  qrCode?: string | null
  secret?: string | null
}

const router = useRouter()

const isLoadingFactors = ref(false)
const isEnrolling = ref(false)
const isVerifying = ref(false)
const isUnenrolling = ref<string | null>(null)

const factors = ref<TotpFactor[]>([])
const enrolledFactorId = ref<string | null>(null)

const setup = ref<EnrollResponse | null>(null)
const challengeId = ref<string | null>(null)

const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  friendlyName: 'Demo Authenticator',
  code: '',
})

const hasActiveSetup = computed(() => Boolean(setup.value?.id))
const hasExistingFactor = computed(() => factors.value.length > 0)

function resetMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

function resetSetupState() {
  setup.value = null
  challengeId.value = null
  form.code = ''
}

async function loadFactors() {
  resetMessages()
  isLoadingFactors.value = true

  try {
    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
      throw error
    }

    factors.value = (data?.totp ?? []).map((factor) => ({
      id: factor.id,
      friendly_name: factor.friendly_name ?? null,
      status: factor.status,
    }))

    enrolledFactorId.value = factors.value[0]?.id ?? null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load MFA factors'
  } finally {
    isLoadingFactors.value = false
  }
}

async function startEnrollment() {
  resetMessages()
  resetSetupState()
  isEnrolling.value = true

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: form.friendlyName.trim() || 'Demo Authenticator',
    })

    if (error) {
      throw error
    }

    setup.value = {
      id: data.id,
      friendlyName: data.friendly_name ?? null,
      uri: data.totp?.uri ?? null,
      qrCode: data.totp?.qr_code ?? null,
      secret: data.totp?.secret ?? null,
    }

    const challengeResult = await supabase.auth.mfa.challenge({
      factorId: data.id,
    })

    if (challengeResult.error) {
      throw challengeResult.error
    }

    challengeId.value = challengeResult.data.id
    successMessage.value =
      'Authenticator enrollment started. Scan the QR code and enter the 6-digit code.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to start MFA enrollment'
    resetSetupState()
  } finally {
    isEnrolling.value = false
  }
}

async function verifyEnrollment() {
  if (!setup.value?.id || !challengeId.value) {
    errorMessage.value = 'No active MFA enrollment found'
    return
  }

  resetMessages()
  isVerifying.value = true

  try {
    const code = form.code.trim()

    if (!/^\d{6}$/.test(code)) {
      throw new Error('Enter a valid 6-digit authentication code')
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: setup.value.id,
      challengeId: challengeId.value,
      code,
    })

    if (error) {
      throw error
    }

    successMessage.value = 'MFA has been enabled successfully for this user.'
    resetSetupState()
    await loadFactors()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to verify MFA code'
  } finally {
    isVerifying.value = false
  }
}

async function removeFactor(factorId: string) {
  resetMessages()
  isUnenrolling.value = factorId

  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    })

    if (error) {
      throw error
    }

    if (setup.value?.id === factorId) {
      resetSetupState()
    }

    successMessage.value = 'MFA factor removed successfully.'
    await loadFactors()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to remove MFA factor'
  } finally {
    isUnenrolling.value = null
  }
}

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    await router.replace('/login')
    return
  }

  await loadFactors()
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-4 md:p-8">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <template #title>MFA Setup</template>

        <template #content>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-slate-600">
              This page is intended for manual demo setup only. Use it once for the selected user,
              then remove or hide the route.
            </p>

            <Message v-if="successMessage" severity="success">
              {{ successMessage }}
            </Message>

            <Message v-if="errorMessage" severity="error">
              {{ errorMessage }}
            </Message>

            <div class="flex flex-wrap gap-3">
              <Button
                label="Refresh factors"
                icon="pi pi-refresh"
                outlined
                :loading="isLoadingFactors"
                @click="loadFactors"
              />

              <Button
                label="Start enrollment"
                icon="pi pi-shield"
                :loading="isEnrolling"
                :disabled="hasActiveSetup"
                @click="startEnrollment"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Existing TOTP factors</template>

        <template #content>
          <div v-if="isLoadingFactors" class="text-sm text-slate-500">Loading factors...</div>

          <div v-else-if="!hasExistingFactor" class="text-sm text-slate-500">
            No MFA factors enrolled yet.
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="factor in factors"
              :key="factor.id"
              class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div class="flex flex-col gap-1">
                <span class="font-medium text-slate-800">
                  {{ factor.friendly_name || 'Unnamed authenticator' }}
                </span>
                <span class="text-xs text-slate-500">Factor ID: {{ factor.id }}</span>
                <span class="text-xs text-slate-500">Status: {{ factor.status || 'unknown' }}</span>
              </div>

              <Button
                label="Remove"
                severity="danger"
                outlined
                :loading="isUnenrolling === factor.id"
                @click="removeFactor(factor.id)"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card v-if="hasActiveSetup">
        <template #title>Complete enrollment</template>

        <template #content>
          <div class="flex flex-col gap-5">
            <p class="text-sm text-slate-600">
              Scan the QR code in Google Authenticator, Microsoft Authenticator, 1Password, Authy,
              or another TOTP app. Then enter the generated 6-digit code below.
            </p>

            <div v-if="setup?.qrCode" class="flex justify-center">
              <div
                class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                v-html="setup.qrCode"
              />
            </div>

            <div v-if="setup?.secret" class="rounded-xl bg-slate-50 p-4">
              <div class="mb-2 text-sm font-medium text-slate-700">Manual setup secret</div>
              <code class="break-all text-sm text-slate-800">{{ setup.secret }}</code>
            </div>

            <div v-if="setup?.uri" class="rounded-xl bg-slate-50 p-4">
              <div class="mb-2 text-sm font-medium text-slate-700">otpauth URI</div>
              <code class="break-all text-xs text-slate-800">{{ setup.uri }}</code>
            </div>

            <Divider />

            <form class="flex flex-col gap-4" @submit.prevent="verifyEnrollment">
              <div class="flex flex-col gap-2">
                <label for="mfa-code" class="text-sm font-medium text-slate-700">
                  6-digit code
                </label>
                <InputText
                  id="mfa-code"
                  v-model="form.code"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="123456"
                />
              </div>

              <div class="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  label="Verify and enable MFA"
                  :loading="isVerifying"
                  :disabled="form.code.trim().length !== 6"
                />

                <Button
                  type="button"
                  label="Cancel"
                  severity="secondary"
                  outlined
                  @click="resetSetupState"
                />
              </div>
            </form>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
