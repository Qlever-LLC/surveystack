<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      @initialize="initialize"
    />
    <app-control-hint :value="control.hint" />

    <div :id="`map-question-geocoder-${index}`" class="geocoder" style="z-index: 200" />

    <div class="map-container my-2" v-if="!mapError">
      <app-gps class="gps-info" :expanded="false" :location="currentLocation.location">
        {{ currentLocation.label }}
      </app-gps>

      <v-btn class="layer-switch" @click="switchMapStyle">
        <v-icon>mdi-layers-outline</v-icon>
      </v-btn>

      <div style="background-color: #000" :id="`map-question-${index}`" class="map-question" v-if="!mapError">
        <img v-if="!value" id="map-marker" src="@/assets/marker.svg" alt="marker" />
        <div class="selection-controls d-flex justify-center">
          <div v-if="!location">
            <v-btn
              large
              :disabled="disablePick"
              :dark="!disablePick"
              class="mx-4 full"
              color="primary"
              @click="pickLocation"
            >
              Pick
            </v-btn>
          </div>
          <div v-else>
            <v-btn large class="mx-4 full" color="gray" @click="retake"> Retake </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div id="map-error-alert" class="my-4" v-else>
      <v-alert type="info" border="right" prominent> Error loading map. </v-alert>
      <app-gps :expanded="true" :location="currentLocation.location">
        {{ currentLocation.label }}
      </app-gps>
    </div>

    <v-overlay class="text-center" :value="!gpsLocation && !mapError && !geolocationError" light absolute>
      <v-card light>
        <v-card-text>
          <div class="subtitle-1 text-center">Getting GPS Coordinates</div>
          <div class="mt-2">
            <v-progress-linear indeterminate rounded height="6" />
          </div>
        </v-card-text>
      </v-card>
    </v-overlay>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script src="./Location.js"></script>

<style scoped src="./Location.css"></style>
