<template>
  <div
    class="wrapper"
    style="height: 100%;"
  >
    <div
      class="full-width fill-height d-flex align-center justify-center"
      v-if="controls.length === 0"
    >
      <div class="d-flex flex-column">
        <v-icon
          large
          color="blue"
        >
          mdi-file-multiple
        </v-icon>
        <v-alert
          type="info"
          text
          color="blue"
          class="ma-4"
        >
          No Questions yet
        </v-alert>
      </div>
    </div>

    <div
      class="draft-container"
      v-if="submission && survey && controls.length !== 0"
    >
      <draft-toolbar
        :group="groupPath"
        :required="control && control.options && control.options.required"
        :anon="control && control.options && control.options.redacted"
        :showOverviewIcon="!atEnd"
        :questionNumber="questionNumber"
        v-if="!showOverview && index < positions.length"
        @showOverviewClicked="showOverview = !showOverview"
      />
      <draft-title
        v-if="!showOverview && index < positions.length"
        :breadcrumbs="mbreadcrumbs"
      />
      <transition
        class="transition"
        :name="slide"
      >
        <div
          id="transition-container"
          :key="'container-'+index"
        >
          <v-container
            class="draft-body mx-auto d-flex flex-column align-center justify-center"
            style="min-height: 40vh;"
          >
            <component
              v-if="control && !atEnd"
              class="draft-control full-width d-sm-flex flex-column align-center justify-center px-4"
              :key="'question_'+index"
              :is="componentName"
              :control="control"
              :value="value"
              :index="index"
              :submission="submission"
              :meta="submissionField.meta"
              :resources="survey.resources"
              ref="currentControl"
              @eval="eval"
              @changed="setValue"
              @setStatus="setStatus"
              @setContext="setContext"
              @setRenderQueue="setRenderQueue"
              @show-nav="showNav(true)"
              @hide-nav="showNav(false)"
              @next="handleNext"
              @show-next="showNext(true)"
              @hide-next="showNext(false)"
            />
          </v-container>
        </div>
      </transition>
    </div>

    <v-navigation-drawer
      v-if="survey && showOverview"
      v-model="showOverview"
      clipped
      right
      touchless
      stateless
      class="grey lighten-4 navigation-container"
    >
      <draft-overview
        ref="overview"
        :survey="survey"
        :submission="submission"
        :position="positions[index]"
        :group="groupPath"
        @navigate="navigate"
      />
    </v-navigation-drawer>

    <draft-footer
      class="px-4 grey lighten-5 footer-container"
      :showPrev="!atStart"
      :enableNext="mShowNext && controls.length > 0"
      :showSubmit="atEnd && controls.length > 0"
      :showNav="mShowNav"
      @next="handleNext"
      @prev="handlePrevious"
      @submit="handleNext"
    />

    <error-dialog
      v-model="showApiComposeErrors"
      :errors="apiComposeErrors"
      title="API Compose Errors"
    />

    <confirm-submission-dialog
      v-model="confirmSubmissionIsVisible"
      :group="submission.meta.group.id"
      @submit="() => submit(submission)"
      @set-group="setSubmissionGroup"
      :dateSubmitted="submission.meta.dateSubmitted"
    />
  </div>
</template>

<script src="./DraftComponent.legacy.js">
</script>

<style scoped src="./DraftComponent.css">
</style>

<style>
.question-title-chip {
  display: inline-flex;
  /* background-color: white; */
  /* color: #ff5722; */
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  border: 1px solid black;
}
</style>
