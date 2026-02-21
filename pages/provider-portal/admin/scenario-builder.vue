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

      <!-- Mode Toggle -->
      <div class="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit mb-6">
        <button
          @click="mode = 'create'"
          :class="mode === 'create' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
        >
          Create Scenario
        </button>
        <button
          @click="mode = 'import'"
          :class="mode === 'import' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
        >
          Bulk Import
        </button>
      </div>

      <!-- ============================================================ -->
      <!-- CREATE SCENARIO MODE (existing wizard)                       -->
      <!-- ============================================================ -->
      <div v-show="mode === 'create'">

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
                    {{ getPolicyInfo(pattern.policyId)?.category || pattern.category }}
                  </span>
                </div>
                <div class="font-medium text-neutral-900">
                  {{ getPolicyInfo(pattern.policyId)?.title || 'Select a policy' }}
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

            <!-- Policy Search with Filters -->
            <div class="mb-4">
              <label class="block text-xs font-medium text-neutral-600 mb-1">Policy</label>
              <div class="flex gap-2 mb-2">
                <select
                  :value="policyFilterTopic[index] || 'all'"
                  class="form-input text-sm flex-shrink-0"
                  style="max-width: 180px;"
                  @change="policyFilterTopic[index] = ($event.target as HTMLSelectElement).value"
                >
                  <option value="all">All Topics</option>
                  <option v-for="topic in uniqueTopics" :key="topic" :value="topic">
                    {{ topic }}
                  </option>
                </select>
                <select
                  :value="policyFilterLogicType[index] || 'all'"
                  class="form-input text-sm flex-shrink-0"
                  style="max-width: 180px;"
                  @change="policyFilterLogicType[index] = ($event.target as HTMLSelectElement).value"
                >
                  <option value="all">All Logic Types</option>
                  <option v-for="lt in uniqueLogicTypes" :key="lt" :value="lt">
                    {{ lt }}
                  </option>
                </select>
              </div>
              <div class="relative">
                <input
                  type="text"
                  class="form-input w-full text-sm"
                  :placeholder="getPolicyInfo(pattern.policyId)?.title || 'Search policies by name or ID...'"
                  :value="getPolicySearchQuery(index)"
                  @input="policySearchQuery[index] = ($event.target as HTMLInputElement).value"
                  @focus="openPolicySearch(index)"
                  @blur="closePolicySearch(index)"
                />
                <!-- Selected policy indicator -->
                <div
                  v-if="!policyDropdownOpen[index] && pattern.policyId"
                  class="mt-1 flex items-center gap-2 text-xs text-neutral-500"
                >
                  <span class="font-medium text-neutral-700">{{ getPolicyInfo(pattern.policyId)?.title }}</span>
                  <span class="text-neutral-400">({{ pattern.policyId }})</span>
                </div>
                <!-- Dropdown Results -->
                <div
                  v-if="policyDropdownOpen[index]"
                  class="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg"
                >
                  <div
                    v-if="getFilteredPolicies(index).length === 0"
                    class="px-3 py-2 text-sm text-neutral-500"
                  >
                    No policies match your search
                  </div>
                  <button
                    v-for="policy in getFilteredPolicies(index).slice(0, 50)"
                    :key="policy.id"
                    type="button"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-b-0"
                    :class="{ 'bg-primary-50': pattern.policyId === policy.id }"
                    @mousedown.prevent="selectPolicy(index, policy.id)"
                  >
                    <div class="font-medium text-neutral-900 truncate">{{ policy.title }}</div>
                    <div class="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{{ policy.id }}</span>
                      <span v-if="policy.topic" class="text-neutral-400">{{ policy.topic }}</span>
                      <span v-if="policy.logicType" class="text-neutral-400">{{ policy.logicType }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      </div><!-- end create mode -->

      <!-- ============================================================ -->
      <!-- BULK IMPORT MODE                                             -->
      <!-- ============================================================ -->
      <div v-show="mode === 'import'">

        <!-- State 1: Empty (no file loaded) -->
        <div v-if="bulkState === 'empty'" class="card p-6">
          <h2 class="text-lg font-semibold text-neutral-900 mb-1">Bulk Scenario Import</h2>
          <p class="text-sm text-neutral-600 mb-6">
            Upload a JSON file containing multiple scenario definitions to generate data for all of them at once.
          </p>

          <!-- Drop zone -->
          <div
            class="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
            :class="isDragOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-neutral-400'"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <div class="text-3xl mb-3">📁</div>
            <div class="font-medium text-neutral-700 mb-1">
              Drop .json file here or click to browse
            </div>
            <div class="text-sm text-neutral-500">
              Accepts .json files up to 50MB
            </div>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileSelect"
          />

          <!-- Parse error -->
          <div
            v-if="bulkParseError"
            class="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700"
          >
            {{ bulkParseError }}
          </div>

          <!-- Download template -->
          <div class="mt-4">
            <button type="button" class="btn btn-secondary text-sm" @click="downloadTemplate">
              Download Template
            </button>
          </div>
        </div>

        <!-- State 2: Loaded (file parsed, showing validation) -->
        <div v-else-if="bulkState === 'loaded'" class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg">📄</span>
                <span class="font-medium text-neutral-900">{{ bulkFileName }}</span>
              </div>
              <div class="text-sm text-neutral-600 mt-1">
                Scenarios found: {{ bulkScenarios.length }}
              </div>
            </div>
            <button
              type="button"
              class="text-sm text-neutral-500 hover:text-error-600 transition-colors"
              @click="clearBulkFile"
            >
              ✕ Remove
            </button>
          </div>

          <!-- Scenario table -->
          <div class="border border-neutral-200 rounded-lg overflow-hidden mb-4">
            <table class="w-full text-sm">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-10">#</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600">Name</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-24">Patterns</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-28">Timeline</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(scenario, i) in bulkScenarios"
                  :key="i"
                  class="border-t border-neutral-100"
                  :class="scenario.valid ? '' : 'bg-error-50/50'"
                >
                  <td class="px-4 py-2 text-neutral-500">{{ i + 1 }}</td>
                  <td class="px-4 py-2">
                    <span v-if="scenario.valid" class="text-neutral-900">{{ scenario.name }}</span>
                    <span v-else class="text-error-600" :title="scenario.error">
                      ✗ {{ scenario.name || 'Invalid scenario' }}
                    </span>
                  </td>
                  <td class="px-4 py-2 text-neutral-600">
                    {{ scenario.valid ? scenario.patternCount : '—' }}
                  </td>
                  <td class="px-4 py-2 text-neutral-600">
                    {{ scenario.valid && scenario.timelineDays ? `${scenario.timelineDays} days` : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-sm text-neutral-600 mb-4">
            Valid: <strong>{{ bulkValidCount }}</strong> of {{ bulkScenarios.length }} scenarios
          </div>

          <div class="flex items-center justify-between">
            <button type="button" class="btn btn-secondary" @click="clearBulkFile">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="bulkValidCount === 0"
              @click="startBulkGeneration"
            >
              Generate All ({{ bulkValidCount }} scenario{{ bulkValidCount !== 1 ? 's' : '' }})
            </button>
          </div>
        </div>

        <!-- State 3: Generating (in progress) -->
        <div v-else-if="bulkState === 'generating'" class="card p-6">
          <div class="mb-4">
            <div class="font-medium text-neutral-900 mb-2">
              {{ bulkJob?.progress.phase || 'Starting...' }}
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-neutral-200 rounded-full h-3">
              <div
                class="bg-primary-600 h-3 rounded-full transition-all duration-500"
                :style="{ width: bulkProgressPercent + '%' }"
              />
            </div>
            <div class="text-sm text-neutral-500 mt-1">
              {{ bulkProgressPercent }}%
            </div>
          </div>

          <!-- Results table -->
          <div class="border border-neutral-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-10">#</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600">Name</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-24">Status</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(result, i) in bulkJob?.results || []"
                  :key="i"
                  class="border-t border-neutral-100"
                >
                  <td class="px-4 py-2 text-neutral-500">{{ i + 1 }}</td>
                  <td class="px-4 py-2 text-neutral-900">{{ result.scenarioName }}</td>
                  <td class="px-4 py-2">
                    <span v-if="result.status === 'succeeded'" class="text-success-600">✓ Done</span>
                    <span v-else-if="result.status === 'generating'" class="text-primary-600">⏳ ...</span>
                    <span v-else-if="result.status === 'failed'" class="text-error-600">✗ Failed</span>
                    <span v-else-if="result.status === 'skipped'" class="text-neutral-400">Skipped</span>
                    <span v-else class="text-neutral-400">○</span>
                  </td>
                  <td class="px-4 py-2 text-neutral-600">
                    <span v-if="result.status === 'succeeded' && result.stats">
                      {{ result.stats.claims.toLocaleString() }} claims
                    </span>
                    <span v-else-if="result.status === 'generating'">Generating</span>
                    <span v-else-if="result.status === 'failed'" class="text-error-600" :title="result.error">
                      {{ result.error }}
                    </span>
                    <span v-else>Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- State 4: Complete -->
        <div v-else-if="bulkState === 'complete'" class="card p-6">
          <div class="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
            <div class="font-medium text-success-800 mb-1">✓ Bulk import complete</div>
            <div class="text-sm text-success-700">
              {{ bulkCompletedCount }} scenario{{ bulkCompletedCount !== 1 ? 's' : '' }} generated
              · {{ bulkTotalClaims.toLocaleString() }} claims
              · {{ bulkTotalDuration }}
            </div>
          </div>

          <!-- Final results table -->
          <div class="border border-neutral-200 rounded-lg overflow-hidden mb-6">
            <table class="w-full text-sm">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-10">#</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600">Name</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600 w-24">Status</th>
                  <th class="text-left px-4 py-2 font-medium text-neutral-600">Claims</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(result, i) in bulkJob?.results || []"
                  :key="i"
                  class="border-t border-neutral-100"
                >
                  <td class="px-4 py-2 text-neutral-500">{{ i + 1 }}</td>
                  <td class="px-4 py-2 text-neutral-900">{{ result.scenarioName }}</td>
                  <td class="px-4 py-2">
                    <span v-if="result.status === 'succeeded'" class="text-success-600">✓</span>
                    <span v-else-if="result.status === 'failed'" class="text-error-600" :title="result.error">✗</span>
                    <span v-else class="text-neutral-400">—</span>
                  </td>
                  <td class="px-4 py-2 text-neutral-600">
                    {{ result.stats ? result.stats.claims.toLocaleString() : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between">
            <button type="button" class="btn btn-secondary" @click="clearBulkFile">
              Import Another File
            </button>
            <NuxtLink to="/provider-portal/" class="btn btn-primary">
              View Dashboard →
            </NuxtLink>
          </div>
        </div>

        <!-- State 5: Error -->
        <div v-else-if="bulkState === 'error'" class="card p-6">
          <div class="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
            <div class="font-medium text-error-800 mb-1">✗ Bulk import failed</div>
            <div class="text-sm text-error-700">
              {{ bulkJob?.error || 'An unexpected error occurred' }}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" class="btn btn-primary" @click="startBulkGeneration">
              Try Again
            </button>
            <button type="button" class="btn btn-secondary" @click="clearBulkFile">
              Import Different File
            </button>
          </div>
        </div>

      </div><!-- end import mode -->

    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useScenarioBuilder,
  specialtyConfigurations,
  type EngagementLevel,
} from '~/composables/useScenarioBuilder'
import { ref, computed, reactive, onMounted, onUnmounted, useTemplateRef } from 'vue'

// Top-level mode toggle
const mode = ref<'create' | 'import'>('create')

const {
  input,
  currentStep,
  validationErrors,
  generatedScenario,
  endDate,
  totalProviders,
  availablePolicies,
  uniqueTopics,
  uniqueLogicTypes,
  policiesLoading,
  policiesError,
  loadPolicies,
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

// Load policies on mount
onMounted(() => {
  loadPolicies()
})

// Helper to get policy info by ID
function getPolicyInfo(policyId: string) {
  return availablePolicies.value.find(p => p.id === policyId)
}

// Policy type-ahead search state (per pattern index)
const policySearchQuery = ref<Record<number, string>>({})
const policyFilterTopic = ref<Record<number, string>>({})
const policyFilterLogicType = ref<Record<number, string>>({})
const policyDropdownOpen = ref<Record<number, boolean>>({})

function getPolicySearchQuery(index: number): string {
  return policySearchQuery.value[index] || ''
}

function getFilteredPolicies(index: number) {
  const query = (policySearchQuery.value[index] || '').toLowerCase()
  const topicFilter = policyFilterTopic.value[index] || 'all'
  const logicFilter = policyFilterLogicType.value[index] || 'all'

  return availablePolicies.value.filter(p => {
    if (topicFilter !== 'all' && p.topic !== topicFilter) return false
    // Check if any of the policy's logic types match the filter
    if (logicFilter !== 'all') {
      const policyLogicTypes = p.logicType ? p.logicType.split(/,\s*/).map(lt => lt.trim()) : []
      if (!policyLogicTypes.includes(logicFilter)) return false
    }
    if (query) {
      return p.title.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    }
    return true
  })
}

function selectPolicy(index: number, policyId: string) {
  const pattern = input.patterns[index]
  if (pattern) {
    pattern.policyId = policyId
    updatePatternFromPolicy(index, policyId)
  }
  policyDropdownOpen.value[index] = false
  policySearchQuery.value[index] = ''
}

function openPolicySearch(index: number) {
  // Close all other dropdowns
  for (const key of Object.keys(policyDropdownOpen.value)) {
    policyDropdownOpen.value[Number(key)] = false
  }
  policyDropdownOpen.value[index] = true
}

function closePolicySearch(index: number) {
  // Small delay to allow click events on dropdown items
  setTimeout(() => {
    policyDropdownOpen.value[index] = false
  }, 200)
}

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

// =============================================================================
// BULK IMPORT
// =============================================================================

interface BulkScenarioRow {
  id: string
  name: string
  valid: boolean
  error?: string
  patternCount: number
  timelineDays: number | null
  raw: Record<string, unknown>
}

interface BulkJobResult {
  scenarioId: string
  scenarioName: string
  status: 'pending' | 'generating' | 'succeeded' | 'failed' | 'skipped'
  error?: string
  stats?: {
    claims: number
    deniedClaims: number
    appeals: number
    snapshots: number
    learningEvents: number
    durationMs: number
  }
}

interface BulkJob {
  jobId: string
  status: 'started' | 'validating' | 'generating' | 'completed' | 'failed'
  scenarioCount: number
  progress: { current: number; total: number; phase: string }
  results: BulkJobResult[]
  error?: string
  startedAt: string
  completedAt?: string
}

const bulkState = ref<'empty' | 'loaded' | 'generating' | 'complete' | 'error'>('empty')
const bulkFileName = ref('')
const bulkScenarios = ref<BulkScenarioRow[]>([])
const bulkRawPayload = ref<Record<string, unknown>[]>([])
const bulkParseError = ref('')
const bulkJob = ref<BulkJob | null>(null)
const isDragOver = ref(false)
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')

let bulkPollInterval: ReturnType<typeof setInterval> | null = null

const bulkValidCount = computed(() => bulkScenarios.value.filter(s => s.valid).length)

const bulkProgressPercent = computed(() => {
  if (!bulkJob.value) return 0
  const { current, total } = bulkJob.value.progress
  if (total === 0) return 0
  return Math.round((current / total) * 100)
})

const bulkCompletedCount = computed(() =>
  (bulkJob.value?.results || []).filter(r => r.status === 'succeeded').length
)

const bulkTotalClaims = computed(() =>
  (bulkJob.value?.results || []).reduce((sum, r) => sum + (r.stats?.claims || 0), 0)
)

const bulkTotalDuration = computed(() => {
  const ms = (bulkJob.value?.results || []).reduce((sum, r) => sum + (r.stats?.durationMs || 0), 0)
  return (ms / 1000).toFixed(1) + 's'
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function processFile(file: File) {
  bulkParseError.value = ''

  if (!file.name.endsWith('.json')) {
    bulkParseError.value = 'Only .json files are accepted'
    return
  }
  if (file.size > 50 * 1024 * 1024) {
    bulkParseError.value = 'File exceeds 50MB limit'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)

      if (!data || typeof data !== 'object') {
        bulkParseError.value = 'File must contain a JSON object'
        return
      }

      const scenarios = data.scenarios
      if (!Array.isArray(scenarios) || scenarios.length === 0) {
        bulkParseError.value = 'File must have a non-empty "scenarios" array'
        return
      }

      // Parse and validate each scenario lightly
      bulkScenarios.value = scenarios.map((s: Record<string, unknown>) => {
        const errors: string[] = []
        if (!s.id || typeof s.id !== 'string') errors.push('Missing "id"')
        if (!s.name || typeof s.name !== 'string') errors.push('Missing "name"')
        if (!s.timeline || typeof s.timeline !== 'object') errors.push('Missing "timeline"')
        if (!s.patterns || !Array.isArray(s.patterns)) errors.push('Missing "patterns"')

        let timelineDays: number | null = null
        if (s.timeline && typeof s.timeline === 'object') {
          const tl = s.timeline as Record<string, unknown>
          if (tl.startDate && tl.endDate) {
            const start = new Date(tl.startDate as string)
            const end = new Date(tl.endDate as string)
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              timelineDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            }
          }
        }

        return {
          id: (s.id as string) || '(unknown)',
          name: (s.name as string) || '(unnamed)',
          valid: errors.length === 0,
          error: errors.length > 0 ? errors.join(', ') : undefined,
          patternCount: Array.isArray(s.patterns) ? s.patterns.length : 0,
          timelineDays,
          raw: s,
        }
      })

      bulkRawPayload.value = scenarios
      bulkFileName.value = file.name
      bulkState.value = 'loaded'
    } catch {
      bulkParseError.value = 'Invalid JSON — could not parse the file'
    }
  }
  reader.readAsText(file)
}

function clearBulkFile() {
  bulkState.value = 'empty'
  bulkFileName.value = ''
  bulkScenarios.value = []
  bulkRawPayload.value = []
  bulkParseError.value = ''
  bulkJob.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  stopBulkPolling()
}

async function startBulkGeneration() {
  try {
    const response = await $fetch<{ jobId: string; scenarioCount: number; status: string }>(
      '/api/admin/scenarios/bulk-import',
      {
        method: 'POST',
        body: { scenarios: bulkRawPayload.value },
      }
    )

    bulkJob.value = {
      jobId: response.jobId,
      status: 'started',
      scenarioCount: response.scenarioCount,
      progress: { current: 0, total: response.scenarioCount, phase: 'Starting' },
      results: bulkRawPayload.value.map((s) => ({
        scenarioId: (s.id as string) || '',
        scenarioName: (s.name as string) || '',
        status: 'pending' as const,
      })),
      startedAt: new Date().toISOString(),
    }
    bulkState.value = 'generating'

    // Start polling
    bulkPollInterval = setInterval(pollBulkStatus, 2000)
  } catch (err) {
    bulkState.value = 'error'
    bulkJob.value = {
      jobId: '',
      status: 'failed',
      scenarioCount: 0,
      progress: { current: 0, total: 0, phase: 'Failed' },
      results: [],
      error: err instanceof Error ? err.message : 'Failed to start bulk import',
      startedAt: new Date().toISOString(),
    }
  }
}

async function pollBulkStatus() {
  if (!bulkJob.value?.jobId) return

  try {
    const data = await $fetch<BulkJob>(
      `/api/admin/scenarios/bulk-import-status?jobId=${bulkJob.value.jobId}`
    )
    bulkJob.value = data

    if (data.status === 'completed') {
      bulkState.value = 'complete'
      stopBulkPolling()
    } else if (data.status === 'failed') {
      // Check if any scenarios succeeded
      const anySucceeded = data.results.some(r => r.status === 'succeeded')
      bulkState.value = anySucceeded ? 'complete' : 'error'
      stopBulkPolling()
    }
  } catch {
    // Ignore transient polling errors
  }
}

function stopBulkPolling() {
  if (bulkPollInterval) {
    clearInterval(bulkPollInterval)
    bulkPollInterval = null
  }
}

function downloadTemplate() {
  const template = {
    scenarios: [
      {
        id: 'my-scenario-id',
        name: 'My Scenario Name',
        description: 'Description of this scenario',
        timeline: {
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          periodDays: 180,
          keyEvents: [
            {
              date: '2025-02-15',
              type: 'training',
              description: 'Staff training session on denial prevention',
              impactedPatterns: ['pattern-example-001'],
            },
          ],
        },
        practice: {
          id: 'practice-example-001',
          name: 'Example Medical Practice',
          taxId: '12-3456789',
          address: {
            street: '100 Main Street',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
          },
          providers: [
            {
              id: 'prov-example-001',
              name: 'Dr. Jane Smith',
              npi: '1234567890',
              specialty: 'Family Medicine',
              taxonomy: '207Q00000X',
              claimWeight: 1.0,
            },
          ],
        },
        volume: {
          totalClaims: 500,
          monthlyVariation: {
            '2025-01': 0.95,
            '2025-02': 1.0,
            '2025-03': 1.05,
            '2025-04': 1.0,
            '2025-05': 0.95,
            '2025-06': 1.05,
          },
          claimLinesPerClaim: { min: 1, max: 4 },
          claimValueRanges: {
            low: { min: 75, max: 300 },
            medium: { min: 300, max: 2000 },
            high: { min: 2000, max: 10000 },
          },
        },
        patterns: [
          {
            id: 'pattern-example-001',
            title: 'Modifier-25 Missing on E/M Services',
            description: 'E/M services billed same day as procedures denied due to missing modifier-25',
            category: 'modifier-missing',
            status: 'improving',
            tier: 'high',
            procedureCodes: ['99213', '99214', '99215'],
            policies: [{ id: 'POL-MOD-25', triggerRate: 0.85 }],
            denialReason: 'Modifier-25 required for significant, separately identifiable E/M service',
            claimDistribution: {
              total: 250,
              deniedBaseline: 63,
              deniedCurrent: 30,
              appealsFiled: 15,
              appealsOverturned: 5,
            },
            trajectory: {
              curve: 'gradual_improvement',
              baseline: {
                periodStart: '2025-01-01',
                periodEnd: '2025-01-31',
                claimCount: 40,
                deniedCount: 10,
                denialRate: 0.25,
                dollarsDenied: 3000,
              },
              current: {
                periodStart: '2025-06-01',
                periodEnd: '2025-06-30',
                claimCount: 42,
                deniedCount: 5,
                denialRate: 0.12,
                dollarsDenied: 1500,
              },
              snapshots: [
                { month: '2025-01', denialRate: 0.25, dollarsDenied: 3000 },
                { month: '2025-03', denialRate: 0.18, dollarsDenied: 2160 },
                { month: '2025-06', denialRate: 0.12, dollarsDenied: 1500 },
              ],
            },
            engagement: {
              firstViewedDate: '2025-01-10',
              totalViews: 12,
              claimLabTests: 5,
              claimsExported: 3,
              actionsRecorded: [],
            },
            remediation: {
              shortTerm: {
                description: 'Resubmit denied claims with modifier-25 documentation',
                canResubmit: true,
                claimCount: 10,
                amount: 3000,
              },
              longTerm: {
                description: 'Establish documentation standards for modifier-25',
                steps: ['Create documentation template', 'Train staff', 'Schedule quarterly audits'],
              },
            },
          },
        ],
        learningEvents: {
          eventDistribution: {
            pattern_viewed: 20,
            claim_inspected: 30,
            claims_exported: 8,
            action_recorded: 10,
          },
          eventClustering: {
            'pattern-example-001': ['2025-02-15', '2025-03-01', '2025-04-15'],
          },
        },
        targetMetrics: {
          totalClaims: 500,
          totalDenied: 60,
          overallDenialRate: 0.12,
          totalDollarsDenied: 12000,
          totalAppeals: 15,
          appealSuccessRate: 0.33,
        },
      },
    ],
  }

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scenario-template.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Clean up bulk polling on unmount
onUnmounted(() => {
  stopBulkPolling()
})
</script>
