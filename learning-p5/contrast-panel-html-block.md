      <!-- Contrast panel (wired by JS) -->
      <div class="hud-section contrast-panel">
        <div class="hud-subbox regular">
          <div class="subbox-slider">
              <!-- saturation scale -->
              <div>saturation scale: <span id="lbl-sat">1.00</span></div>
              <!-- saturation scale slider -->
              <input id="sl-sat" type="range" min="0.5" max="1.8" step="0.05" value="1.00" style="width:100%;">
          </div>
          <div class="subbox-slider">
              <!-- value gamma -->
              <div>value gamma: <span id="lbl-gam">1.00</span></div>
              <!-- value gamma slider -->
              <input id="sl-gam" type="range" min="0.6" max="1.6" step="0.05" value="1.00" style="width:100%;">
            </div>
        </div>
        <div class="hud-subbox advanced">
            <!-- min Δ (gen) -->
            <div>min Δ (gen): <span id="lbl-mind">1.20</span></div>
            <!-- min Δ (gen) slider -->
            <input id="sl-mind" type="range" min="0.6" max="2.5" step="0.05" value="1.20" style="width:100%;">
            <!-- bands -->
            <div>bands: <span id="lbl-bands">2</span></div>
            <!-- bands slider -->
            <input id="sl-bands" type="range" min="1" max="4" step="1" value="2" style="width:100%;">
            <!-- column value -->
            <label>Column span: <span id="lbl-colspan">0</span></label>
            <!-- column value slider -->
            <input id="sl-colspan" type="range" min="0" max="20" step="1" value="0" style="width:100%;">
            <!-- per-band value bump minimum -->
            <label>V band min: <span id="lbl-vband-min">0.0</span></label>
            <!-- per-band value bump minimum slider -->
            <input id="sl-vband-min" type="range" min="-5" max="0" step="0.5" value="0" style="width:100%;">
            <!-- per-band value bump maximum -->
            <label>V band max: <span id="lbl-vband-max">0.0</span></label>
            <!-- per-band value bump maximum slider -->
            <input id="sl-vband-max" type="range" min="0" max="5" step="0.5" value="0" style="width:100%;">
            <!-- value contrast -->
            <label>V contrast: <span id="lbl-vcontrast">1.00</span></label>
            <!-- value contrast slider -->
            <input id="sl-vcontrast" type="range" min="1.00" max="1.20" step="0.01" value="1.00" style="width:100%;">
            <!-- value gamma (gen) -->
            <label>V gamma (gen): <span id="lbl-vgamma-gen">1.00</span></label>
            <!-- value gamma (gen) slider -->
            <input id="sl-vgamma-gen" type="range" min="0.80" max="1.20" step="0.01" value="1.00" style="width:100%;">
          </div>
      </div>