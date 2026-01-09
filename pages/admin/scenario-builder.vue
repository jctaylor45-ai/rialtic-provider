<template>
  <div class="min-h-screen bg-neutral-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-neutral-900">Scenario Builder</h1>
        <p class="mt-1 text-neutral-600">
          Create mock data scenarios for testing and demonstration
        </p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <template v-for="(step, index) in steps" :key="step.id">
            <button
              type="button"
              class="flex items-center gap-2"
              :class="currentStep >= step.id ? 'text-primary-600' : 'text-neutral-400'"
              @click="currentStep = step.id"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2"
                :class="
                  currentStep === step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : currentStep > step.id
                      ? 'bg-primary-100 border-primary-600 text-primary-600'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                "
              >
                {{ step.id }}
              </div>
              <span class="hidden sm:inline font-medium">{{ step.name }}</span>
            </button>
            <div
              v-if="index < steps.length - 1"
              class="flex-1 h-0.5 mx-4"
              :class="currentStep > step.id ? 'bg-primary-600' : 'bg-neutral-200'"
            />
          </template>
        </div>
      </div>

      <!-- Validation Errors -->
      <div
        v-if="validationErrors.length > 0"
        class="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg"
      >
        <h3 class="font-medium text-error-800 mb-2">Please fix the following:</h3>
        <ul class="list-disc list-inside text-sm text-error-700 space-y-1">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <!-- Step 1: Basics -->
      <div v-show="currentStep === 1" class="card p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-6">Basic Information</h2>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Scenario Name <span class="text-error-500">*</span>
            </label>
            <input
              v-model="input.scenarioName"
              type="text"
              class="form-input w-full"
              placeholder="e.g., Large Orthopedic Practice - Q4 2024"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              v-model="input.description"
              rows="2"
              class="form-input w-full"
              placeholder="Brief description of this scenario..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Start Date <span class="text-error-500">*</span>
              </label>
              <input v-model="input.startDate" type="date" class="form-input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Duration (months) <span class="text-error-500">*</span>
              </label>
              <select v-model.number="input.durationMonths" class="form-input w-full">
                <option :value="3">3 months</option>
                <option :value="6">6 months</option>
                <option :value="9">9 months</option>
                <option :value="12">12 months</option>
              </select>
            </div>
          </div>

          <div v-if="endDate" class="text-sm text-neutral-600">
            Timeline: {{ formatDate(input.startDate) }} to {{ formatDate(endDate) }}
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Practice Name <span class="text-error-500">*</span>
            </label>
            <input
              v-model="input.practiceName"
              type="text"
              class="form-input w-full"
              placeholder="e.g., Advanced Orthopedic Associates"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Total Claims <span class="text-error-500">*</span>
            </label>
            <input
              v-model.number="input.totalClaims"
              type="number"
              min="100"
              step="100"
              class="form-input w-full"
            />
            <p class="mt-1 text-xs text-neutral-500">
              Minimum 100 claims. This determines the overall volume of generated data.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2: Practice Setup -->
      <div v-show="currentStep === 2" class="card p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-6">Practice Setup</h2>

        <div class="space-y-6">
          <!-- Add Specialty -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Add Specialty</label>
            <div class="flex gap-2">
              <select v-model="selectedSpecialty" class="form-input flex-1">
                <option value="">Select a specialty...</option>
                <option
                  v-for="config in availableSpecialties"
                  :key="config.specialty"
                  :value="config.specialty"
                >
                  {{ config.specialty }}
                </option>
              </select>
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="!selectedSpecialty"
                @click="addSelectedSpecialty"
              >
                Add
              </button>
            </div>
          </div>

          <!-- Specialty List -->
          <div v-if="input.specialties.length > 0" class="space-y-3">
            <label class="block text-sm font-medium text-neutral-700">Specialties & Providers</label>

            <div
              v-for="(spec, index) in input.specialties"
              :key="index"
              class="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium text-neutral-900">{{ spec.specialty }}</div>
                <div class="text-xs text-neutral-500">
                  {{ getSpecialtyConfig(spec.specialty)?.taxonomy }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm text-neutral-600">Providers:</label>
                <input
                  v-model.number="spec.providerCount"
                  type="number"
                  min="1"
                  max="10"
                  class="form-input w-20"
                />
              </div>
              <button
                type="button"
                class="p-1 text-neutral-400 hover:text-error-600"
                @click="removeSpecialty(index)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="text-sm text-neutral-600">
              Total providers: <strong>{{ totalProviders }}</strong>
            </div>
          </div>

          <div
            v-else
            class="p-8 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-500"
          >
            No specialties added yet. Add at least one specialty to continue.
          </div>

          <!-- Engagement Level -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Engagement Level
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="level in engagementLevels"
                :key="level.value"
                type="button"
                class="p-3 rounded-lg border-2 text-left transition-colors"
                :class="
                  input.engagementLevel === level.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                "
                @click="input.engagementLevel = level.value"
              >
                <div class="font-medium text-neutral-900">{{ level.label }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ level.description }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Patterns -->
      <div v-show="currentStep === 3" class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-neutral-900">Denial Patterns</h2>
          <button type="button" class="btn btn-secondary" @click="addPattern">
            + Add Pattern
          </button>
        </div>

        <div v-if="input.patterns.length > 0" class="space-y-4">
          <div
            v-for="(pattern, index) in input.patterns"
            :key="index"
            class="border border-neutral-200 rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getTierClass(pattern.tier)"
                  >
                    {{ pattern.tier.toUpperCase() }}
                  </span>
                  <span class="text-sm text-neutral-500">
                    {{ policyToPatternMap[pattern.policyId]?.category || pattern.category }}
                  </span>
                </div>
                <div class="font-medium text-neutral-900">
                  {{ policyToPatternMap[pattern.policyId]?.title || 'Select a policy' }}
                </div>
              </div>
              <button
                type="button"
                class="p-1 text-neutral-400 hover:text-error-600"
                @click="removePattern(index)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">Policy</label>
                <select
                  v-model="pattern.policyId"
                  class="form-input w-full text-sm"
                  @change="updatePatternFromPolicy(index, pattern.policyId)"
                >
                  <option v-for="policy in availablePolicies" :key="policy.id" :value="policy.id">
                    {{ policy.title }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">Tier</label>
                <select v-model="pattern.tier" class="form-input w-full text-sm">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">Trajectory</label>
                <select v-model="pattern.trajectory" class="form-input w-full text-sm">
                  <option value="steep_improvement">Steep Improvement</option>
                  <option value="gradual_improvement">Gradual Improvement</option>
                  <option value="slight_improvement">Slight Improvement</option>
                  <option value="stable">Stable</option>
                  <option value="regression">Regression</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">Claim Count</label>
                <input
                  v-model.number="pattern.claimCount"
                  type="number"
                  min="10"
                  class="form-input w-full text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">
                  Baseline Denial Rate (%)
                </label>
                <input
                  v-model.number="pattern.baselineDenialRate"
                  type="number"
                  min="0"
                  max="100"
                  class="form-input w-full text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">
                  Current Denial Rate (%)
                </label>
                <input
                  v-model.number="pattern.currentDenialRate"
                  type="number"
                  min="0"
                  max="100"
                  class="form-input w-full text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 mb-1">
                  Appeal Rate (%)
                </label>
                <input
                  v-model.number="pattern.appealRate"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  class="form-input w-full text-sm"
                />
              </div>
            </div>

            <!-- Visual indicator of improvement -->
            <div class="mt-4 flex items-center gap-2 text-sm">
              <span
                class="inline-flex items-center gap-1"
                :class="
                  pattern.currentDenialRate < pattern.baselineDenialRate
                    ? 'text-success-600'
                    : pattern.currentDenialRate > pattern.baselineDenialRate
                      ? 'text-error-600'
                      : 'text-neutral-500'
                "
              >
                <svg
                  v-if="pattern.currentDenialRate < pattern.baselineDenialRate"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l-6 5m0 0l6 5m-6-5h12"
                  />
                </svg>
                <svg
                  v-else-if="pattern.currentDenialRate > pattern.baselineDenialRate"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17l6-5m0 0l-6-5m6 5H3"
                  />
                </svg>
                {{
                  pattern.currentDenialRate < pattern.baselineDenialRate
                    ? `${Math.round(((pattern.baselineDenialRate - pattern.currentDenialRate) / pattern.baselineDenialRate) * 100)}% improvement`
                    : pattern.currentDenialRate > pattern.baselineDenialRate
                      ? `${Math.round(((pattern.currentDenialRate - pattern.baselineDenialRate) / pattern.baselineDenialRate) * 100)}% regression`
                      : 'No change'
                }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="p-8 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-500"
        >
          No patterns added yet. Add at least one denial pattern to generate a scenario.
        </div>

        <!-- Pattern Summary -->
        <div v-if="input.patterns.length > 0" class="mt-6 p-4 bg-neutral-50 rounded-lg">
          <h3 class="text-sm font-medium text-neutral-700 mb-2">Summary</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-neutral-500">Patterns:</span>
              <span class="ml-1 font-medium">{{ input.patterns.length }}</span>
            </div>
            <div>
              <span class="text-neutral-500">Pattern Claims:</span>
              <span class="ml-1 font-medium">
                {{ input.patterns.reduce((sum, p) => sum + p.claimCount, 0).toLocaleString() }}
              </span>
            </div>
            <div>
              <span class="text-neutral-500">% of Total:</span>
              <span class="ml-1 font-medium">
                {{
                  Math.round(
                    (input.patterns.reduce((sum, p) => sum + p.claimCount, 0) / input.totalClaims) *
                      100
                  )
                }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Preview & Export -->
      <div v-show="currentStep === 4" class="space-y-6">
        <!-- Generation Controls -->
        <div class="card p-6 border-2 border-primary-200 bg-primary-50/30">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Live Data Generation</h2>
              <p class="text-sm text-neutral-600 mt-1">
                Generate continuous mock data based on your scenario configuration
              </p>
            </div>
            <div
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="generationStatus.isRunning ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'"
            >
              {{ generationStatus.isRunning ? 'Running' : 'Stopped' }}
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Claims/Day</label>
              <input
                v-model.number="generationConfig.claimsPerDay"
                type="number"
                min="10"
                max="1000"
                step="10"
                class="form-input w-full text-sm"
                :disabled="generationStatus.isRunning"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Speed</label>
              <select
                v-model.number="generationConfig.speed"
                class="form-input w-full text-sm"
                :disabled="generationStatus.isRunning"
              >
                <option :value="1">Real-time (1x)</option>
                <option :value="10">Fast (10x)</option>
                <option :value="100">Very Fast (100x)</option>
                <option :value="1000">Maximum (1000x)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Generate Appeals</label>
              <select
                v-model="generationConfig.generateAppeals"
                class="form-input w-full text-sm"
                :disabled="generationStatus.isRunning"
              >
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Generate Events</label>
              <select
                v-model="generationConfig.generateEvents"
                class="form-input w-full text-sm"
                :disabled="generationStatus.isRunning"
              >
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <button
              v-if="!generationStatus.isRunning"
              type="button"
              class="btn btn-primary"
              :disabled="!generatedScenario"
              @click="startGeneration"
            >
              Start Generation
            </button>
            <button
              v-else
              type="button"
              class="btn bg-error-600 text-white hover:bg-error-700"
              @click="stopGeneration"
            >
              Stop Generation
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="generationStatus.isRunning"
              @click="runSingleBatch"
            >
              Run Single Batch
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="refreshStatus"
            >
              Refresh Status
            </button>
          </div>

          <!-- Generation Stats -->
          <div v-if="generationStatus.stats.batchesCompleted > 0" class="mt-4 p-3 bg-white rounded-lg">
            <h4 class="text-sm font-medium text-neutral-700 mb-2">Generation Statistics</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-neutral-500">Claims Generated:</span>
                <span class="ml-1 font-medium">{{ generationStatus.stats.claimsGenerated.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Appeals Generated:</span>
                <span class="ml-1 font-medium">{{ generationStatus.stats.appealsGenerated.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Events Generated:</span>
                <span class="ml-1 font-medium">{{ generationStatus.stats.eventsGenerated.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Batches:</span>
                <span class="ml-1 font-medium">{{ generationStatus.stats.batchesCompleted }}</span>
              </div>
            </div>
            <div v-if="generationStatus.database" class="mt-3 pt-3 border-t border-neutral-100">
              <h4 class="text-sm font-medium text-neutral-700 mb-2">Database Totals</h4>
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-neutral-500">Total Claims:</span>
                  <span class="ml-1 font-medium">{{ generationStatus.database.totalClaims.toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-neutral-500">Total Appeals:</span>
                  <span class="ml-1 font-medium">{{ generationStatus.database.totalAppeals.toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-neutral-500">Total Events:</span>
                  <span class="ml-1 font-medium">{{ generationStatus.database.totalEvents.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-neutral-900">Preview</h2>
            <div class="flex gap-2">
              <button type="button" class="btn btn-secondary" @click="generateAndPreview">
                Regenerate
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!generatedScenario"
                @click="exportScenario"
              >
                Export .scenario.ts
              </button>
            </div>
          </div>

          <div v-if="generatedScenario" class="space-y-6">
            <!-- Scenario Overview -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-neutral-50 rounded-lg">
                <div class="text-sm text-neutral-500">Total Claims</div>
                <div class="text-xl font-semibold text-neutral-900">
                  {{ generatedScenario.targetMetrics.totalClaims.toLocaleString() }}
                </div>
              </div>
              <div class="p-4 bg-neutral-50 rounded-lg">
                <div class="text-sm text-neutral-500">Total Denied</div>
                <div class="text-xl font-semibold text-neutral-900">
                  {{ generatedScenario.targetMetrics.totalDenied.toLocaleString() }}
                </div>
              </div>
              <div class="p-4 bg-neutral-50 rounded-lg">
                <div class="text-sm text-neutral-500">Denial Rate</div>
                <div class="text-xl font-semibold text-neutral-900">
                  {{ generatedScenario.targetMetrics.overallDenialRate }}%
                </div>
              </div>
              <div class="p-4 bg-neutral-50 rounded-lg">
                <div class="text-sm text-neutral-500">Dollars Denied</div>
                <div class="text-xl font-semibold text-neutral-900">
                  ${{ generatedScenario.targetMetrics.totalDollarsDenied.toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- Providers -->
            <div>
              <h3 class="text-sm font-medium text-neutral-700 mb-2">Generated Providers</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div
                  v-for="provider in generatedScenario.practice.providers"
                  :key="provider.id"
                  class="p-2 bg-neutral-50 rounded text-sm"
                >
                  <div class="font-medium">{{ provider.name }}</div>
                  <div class="text-xs text-neutral-500">
                    {{ provider.specialty }} &middot; {{ provider.npi }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Patterns -->
            <div>
              <h3 class="text-sm font-medium text-neutral-700 mb-2">Generated Patterns</h3>
              <div class="space-y-2">
                <div
                  v-for="pattern in generatedScenario.patterns"
                  :key="pattern.id"
                  class="p-3 bg-neutral-50 rounded-lg"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <span
                        class="px-2 py-0.5 rounded text-xs font-medium mr-2"
                        :class="getTierClass(pattern.tier)"
                      >
                        {{ pattern.tier.toUpperCase() }}
                      </span>
                      <span class="font-medium">{{ pattern.title }}</span>
                    </div>
                    <div class="text-sm text-neutral-500">
                      {{ pattern.claimDistribution.total }} claims
                    </div>
                  </div>
                  <div class="mt-2 flex items-center gap-4 text-sm text-neutral-600">
                    <span>
                      Baseline: {{ pattern.trajectory.baseline.denialRate }}%
                    </span>
                    <span>&rarr;</span>
                    <span>
                      Current: {{ pattern.trajectory.current.denialRate }}%
                    </span>
                    <span
                      :class="
                        pattern.trajectory.current.denialRate <
                        pattern.trajectory.baseline.denialRate
                          ? 'text-success-600'
                          : 'text-error-600'
                      "
                    >
                      ({{ pattern.status }})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- JSON Preview -->
            <details class="mt-4">
              <summary class="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900">
                View Raw JSON
              </summary>
              <pre
                class="mt-2 p-4 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto text-xs max-h-96"
              >{{ JSON.stringify(generatedScenario, null, 2) }}</pre>
            </details>
          </div>

          <div
            v-else
            class="p-8 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-500"
          >
            Click "Generate Preview" to see the generated scenario
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-6 flex justify-between">
        <button
          v-if="currentStep > 1"
          type="button"
          class="btn btn-secondary"
          @click="currentStep--"
        >
          Back
        </button>
        <div v-else />

        <div class="flex gap-2">
          <button
            v-if="currentStep < 4"
            type="button"
            class="btn btn-primary"
            @click="nextStep"
          >
            {{ currentStep === 3 ? 'Generate Preview' : 'Next' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="reset">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useScenarioBuilder,
  specialtyConfigurations,
  policyToPatternMap,
  type EngagementLevel,
} from '~/composables/useScenarioBuilder'
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'

const {
  input,
  currentStep,
  validationErrors,
  generatedScenario,
  endDate,
  totalProviders,
  availablePolicies,
  addSpecialty,
  removeSpecialty,
  addPattern,
  removePattern,
  updatePatternFromPolicy,
  validate,
  generateAndPreview,
  exportScenario,
  reset,
} = useScenarioBuilder()

const selectedSpecialty = ref('')

const steps = [
  { id: 1, name: 'Basics' },
  { id: 2, name: 'Practice' },
  { id: 3, name: 'Patterns' },
  { id: 4, name: 'Preview' },
]

const engagementLevels: { value: EngagementLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Few views and actions' },
  { value: 'medium', label: 'Medium', description: 'Moderate engagement' },
  { value: 'high', label: 'High', description: 'Active user with many actions' },
]

// Generation controls
const generationConfig = reactive({
  claimsPerDay: 100,
  speed: 100,
  generateAppeals: true,
  generateEvents: true,
})

const generationStatus = reactive({
  isRunning: false,
  startedAt: null as string | null,
  config: null as typeof generationConfig | null,
  stats: {
    claimsGenerated: 0,
    appealsGenerated: 0,
    eventsGenerated: 0,
    batchesCompleted: 0,
    lastBatchAt: null as string | null,
    errors: 0,
  },
  database: null as { totalClaims: number; totalAppeals: number; totalEvents: number } | null,
})

let statusPollInterval: ReturnType<typeof setInterval> | null = null

async function refreshStatus() {
  try {
    const response = await $fetch('/api/admin/generation/status')
    Object.assign(generationStatus, response)
  } catch (error) {
    console.error('Failed to fetch status:', error)
  }
}

async function startGeneration() {
  if (!generatedScenario.value) return

  try {
    // Build pattern configs from scenario
    const patterns = generatedScenario.value.patterns.map(p => ({
      patternId: p.id,
      rate: (p.trajectory.current.denialRate || 10) / 100,
      denialReason: p.denialReason,
      category: p.category,
    }))

    const response = await $fetch('/api/admin/generation/start', {
      method: 'POST',
      body: {
        claimsPerDay: generationConfig.claimsPerDay,
        speed: generationConfig.speed,
        patterns,
        generateAppeals: generationConfig.generateAppeals,
        generateEvents: generationConfig.generateEvents,
        scenarioId: generatedScenario.value.id,
      },
    })

    if (response.success) {
      generationStatus.isRunning = true
      // Start polling for status updates
      statusPollInterval = setInterval(refreshStatus, 2000)
    }
  } catch (error) {
    console.error('Failed to start generation:', error)
    alert('Failed to start generation. Check console for details.')
  }
}

async function stopGeneration() {
  try {
    const response = await $fetch('/api/admin/generation/stop', {
      method: 'POST',
    })

    if (response.success) {
      generationStatus.isRunning = false
      if (statusPollInterval) {
        clearInterval(statusPollInterval)
        statusPollInterval = null
      }
      // Update stats from response
      Object.assign(generationStatus.stats, response.stats)
    }
  } catch (error) {
    console.error('Failed to stop generation:', error)
  }
}

async function runSingleBatch() {
  if (!generatedScenario.value) return

  try {
    const patterns = generatedScenario.value.patterns.map(p => ({
      patternId: p.id,
      rate: (p.trajectory.current.denialRate || 10) / 100,
      denialReason: p.denialReason,
      category: p.category,
    }))

    const response = await $fetch('/api/admin/generation/batch', {
      method: 'POST',
      body: {
        patterns,
        generateAppeals: generationConfig.generateAppeals,
        generateEvents: generationConfig.generateEvents,
        scenarioId: generatedScenario.value.id,
      },
    })

    if (response.success) {
      // Refresh status to get updated counts
      await refreshStatus()
      alert(`Batch completed: ${response.stats.claimsGenerated} claims, ${response.stats.appealsGenerated} appeals, ${response.stats.eventsGenerated} events`)
    }
  } catch (error) {
    console.error('Failed to run batch:', error)
    alert('Failed to run batch. Check console for details.')
  }
}

onMounted(() => {
  refreshStatus()
})

onUnmounted(() => {
  if (statusPollInterval) {
    clearInterval(statusPollInterval)
  }
})

const availableSpecialties = computed(() => {
  const usedSpecialties = new Set(input.specialties.map(s => s.specialty))
  return specialtyConfigurations.filter(c => !usedSpecialties.has(c.specialty))
})

function addSelectedSpecialty() {
  if (selectedSpecialty.value) {
    addSpecialty(selectedSpecialty.value as any)
    selectedSpecialty.value = ''
  }
}

function getSpecialtyConfig(specialty: string) {
  return specialtyConfigurations.find(c => c.specialty === specialty)
}

function getTierClass(tier: string): string {
  switch (tier) {
    case 'critical':
      return 'bg-error-100 text-error-700'
    case 'high':
      return 'bg-warning-100 text-warning-700'
    case 'medium':
      return 'bg-secondary-100 text-secondary-700'
    case 'low':
      return 'bg-neutral-100 text-neutral-600'
    default:
      return 'bg-neutral-100 text-neutral-600'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function nextStep() {
  if (currentStep.value === 3) {
    generateAndPreview()
  } else {
    currentStep.value++
  }
}
</script>
