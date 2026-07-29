/**
 * GoFive Dashboard Renderer
 *
 * สร้างหน้าตา GoFive Internal Speed Test
 * โดยยังคง Element ID และ Class ที่ LibreSpeed Modern Controller ต้องใช้
 */

(function () {
  "use strict";

  const app = document.querySelector("#app");

  if (!app) {
    console.error("GoFive Dashboard: #app element was not found.");
    return;
  }

  app.innerHTML = `
    <div class="gofive-app">

      <main class="gofive-dashboard">

        <!-- ==================================================
             Header
        =================================================== -->
        <header class="gofive-heading gofive-animate-in">
          <h1>Speed Test GoFive</h1>

          <p class="tagline">
            เว็บไซต์สำหรับทดสอบประสิทธิภาพและความเร็วเครือข่ายภายในองค์กร
          </p>
        </header>


        <!-- ==================================================
             Connection information
        =================================================== -->
        <section
          class="gofive-connection gofive-animate-in"
          aria-labelledby="connection-heading"
        >
          <h2 id="connection-heading">
            ข้อมูลการเชื่อมต่อ
          </h2>

          <div class="gofive-connection-grid">

            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ▣
              </span>

              <div>
                <small>อุปกรณ์</small>
                <strong id="client-device">
                  กำลังตรวจสอบ...
                </strong>
              </div>
            </article>


            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ⌘
              </span>

              <div>
                <small>เครือข่าย</small>
                <strong id="client-network">
                  Internal Network
                </strong>
              </div>
            </article>


            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ◎
              </span>

              <div>
                <small>IP Address</small>
                <strong id="client-ip">
                  กำลังตรวจสอบ...
                </strong>
              </div>
            </article>


            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ◉
              </span>

              <div>
                <small>เบราว์เซอร์</small>
                <strong id="client-browser">
                  กำลังตรวจสอบ...
                </strong>
              </div>
            </article>


            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ⌁
              </span>

              <div>
                <small>ผู้ให้บริการ</small>
                <strong id="client-provider">
                  GoFive Internal
                </strong>
              </div>
            </article>


            <article class="gofive-connection-item">
              <span class="gofive-connection-icon" aria-hidden="true">
                ⌖
              </span>

              <div>
                <small>เขตเวลา</small>
                <strong id="client-timezone">
                  กำลังตรวจสอบ...
                </strong>
              </div>
            </article>

          </div>
        </section>


        <!-- ==================================================
             Server selector
        =================================================== -->
        <section class="gofive-server-section">

          <div class="server-selector">

            <div class="chosen">

              <div class="chevron">
                <img
                  src="images/chevron.svg"
                  alt="เลือกเซิร์ฟเวอร์"
                />
              </div>

              <p>เซิร์ฟเวอร์ที่ใช้ทดสอบ</p>

              <h2 id="selected-server">
                กำลังค้นหาเซิร์ฟเวอร์...
              </h2>

            </div>

            <ul class="servers"></ul>

            <p class="sponsor hidden" id="sponsor">&nbsp;</p>

          </div>

        </section>


        <!-- ==================================================
             Privacy warning
        =================================================== -->
        <p id="privacy-warning" class="hidden">
          เมื่อกดเริ่มทดสอบ ถือว่าคุณยอมรับนโยบายความเป็นส่วนตัว
          <br />

          <a href="#" id="choose-privacy">
            ดูรายละเอียดนโยบายความเป็นส่วนตัว
          </a>
        </p>


        <!-- ==================================================
             Start button
        =================================================== -->
        <button
          id="start-button"
          class="disabled gofive-start-button"
          type="button"
        >
          กำลังโหลด...
        </button>


        <!-- ==================================================
             Result area
        =================================================== -->
        <section class="gauge-layout gofive-result-layout">

          <!-- Ping -->
          <div class="ping gofive-side-metric hidden">

            <span class="label">
              ค่า Ping
            </span>

            <div class="gofive-side-value">
              <span class="value" id="ping">00</span>
              <small>ms</small>
            </div>

          </div>


          <!-- Download Gauge -->
          <article
            class="gauge download gofive-gauge"
            id="download-gauge"
          >
            <div class="progress"></div>
            <div class="speed"></div>

            <!--
              span ตัวแรกต้องเป็นค่าความเร็ว
              เพราะ index.js เดิมใช้ #download-gauge span
            -->
            <h1>
              <span id="download-speed">00</span>
              <small>Mbps</small>
            </h1>

            <h2>ดาวน์โหลด</h2>
          </article>


          <!-- Upload Gauge -->
          <article
            class="gauge upload gofive-gauge"
            id="upload-gauge"
          >
            <div class="progress"></div>
            <div class="speed"></div>

            <!--
              span ตัวแรกต้องเป็นค่าความเร็ว
              เพราะ index.js เดิมใช้ #upload-gauge span
            -->
            <h1>
              <span id="upload-speed">00</span>
              <small>Mbps</small>
            </h1>

            <h2>อัปโหลด</h2>
          </article>


          <!-- Jitter -->
          <div class="jitter gofive-side-metric hidden">

            <span class="label">
              ค่า Jitter
            </span>

            <div class="gofive-side-value">
              <span class="value" id="jitter">00</span>
              <small>ms</small>
            </div>

          </div>

        </section>


        <!-- ==================================================
             Share results
        =================================================== -->
        <button
          id="share-results"
          class="small inverted hidden"
          type="button"
        >
          แชร์ผลการทดสอบ
        </button>
<section
  id="test-result-summary"
  class="gofive-result-summary hidden"
  aria-labelledby="result-summary-title"
>
  <div class="gofive-result-summary__header">
    <div>
      <small>ผลการทดสอบล่าสุด</small>

      <h2 id="result-summary-title">
        Test Summary
      </h2>
    </div>

    <span
      id="result-summary-status"
      class="gofive-result-summary__status"
    >
      สำเร็จ
    </span>
  </div>

  <div class="gofive-result-summary__metrics">

    <article class="gofive-summary-metric">
      <small>Download</small>

      <strong>
        <span id="summary-download">-</span>
        <span class="gofive-summary-unit">Mbps</span>
      </strong>
    </article>

    <article class="gofive-summary-metric">
      <small>Upload</small>

      <strong>
        <span id="summary-upload">-</span>
        <span class="gofive-summary-unit">Mbps</span>
      </strong>
    </article>

    <article class="gofive-summary-metric">
      <small>Ping</small>

      <strong>
        <span id="summary-ping">-</span>
        <span class="gofive-summary-unit">ms</span>
      </strong>
    </article>

    <article class="gofive-summary-metric">
      <small>Jitter</small>

      <strong>
        <span id="summary-jitter">-</span>
        <span class="gofive-summary-unit">ms</span>
      </strong>
    </article>

  </div>

  <div class="gofive-result-summary__details">

    <article>
      <small>ระยะเวลาทดสอบ</small>
      <strong id="summary-duration">-</strong>
    </article>

    <article>
      <small>เซิร์ฟเวอร์</small>
      <strong id="summary-server">-</strong>
    </article>

    <article>
      <small>ทดสอบเสร็จเมื่อ</small>
      <strong id="summary-completed-at">-</strong>
    </article>

  </div>
</section>


        <!-- ==================================================
             Bottom information bar
        =================================================== -->
        <section class="gofive-test-information">

          <article>
            <small>วันและเวลา</small>
            <strong id="test-date-time">-</strong>
          </article>

          <article>
            <small>Test ID</small>
            <strong id="test-id-display">-</strong>
          </article>

          <article>
            <small>เซิร์ฟเวอร์</small>
            <strong id="test-server-display">
              กำลังค้นหา...
            </strong>
          </article>

          <article>
            <small>ประเภทการเชื่อมต่อ</small>
            <strong id="connection-type">
              กำลังตรวจสอบ...
            </strong>
          </article>

        </section>

      </main>


      <!-- ==================================================
           Footer
      =================================================== -->
      <footer class="gofive-footer">

        <p>
          © <span id="current-year"></span> GoFive Co., Ltd.
          Internal Network Speed Test
        </p>

        <p>
          <a href="stability.html">
            ทดสอบความเสถียรของเครือข่าย
          </a>
        </p>

      </footer>


      <!-- ==================================================
           Share dialog
      =================================================== -->
      <dialog
  id="share"
  aria-labelledby="share-dialog-title"
>
  <div class="close-dialog">
    <button
      id="close-share-dialog"
      class="gofive-dialog-close"
      type="button"
      aria-label="ปิดหน้าต่างแชร์ผล"
    >
      <img
        src="images/close-button.svg"
        alt=""
        aria-hidden="true"
      />
    </button>
  </div>

  <section class="gofive-share-dialog-content">

    <header class="gofive-share-dialog-header">
      <small>ผลการทดสอบล่าสุด</small>

      <h2 id="share-dialog-title">
        แชร์ผลการทดสอบ
      </h2>

      <p>
        เลือกวิธีที่ต้องการใช้สำหรับบันทึกหรือแชร์ผลการทดสอบ
      </p>
    </header>

    <img
      id="results"
      class="hidden"
      src=""
      alt="ผลการทดสอบความเร็ว"
    />

    <div class="gofive-share-actions">

      <button
        id="copy-link"
        class="gofive-share-action"
        type="button"
      >
        คัดลอกผลการทดสอบ
      </button>

      <button
        id="native-share-result"
        class="gofive-share-action"
        type="button"
      >
        แชร์ผ่านอุปกรณ์
      </button>

      <button
        id="export-result-json"
        class="gofive-share-action"
        type="button"
      >
        ดาวน์โหลด JSON
      </button>

    </div>

    <p
      id="share-result-status"
      class="gofive-share-status"
      role="status"
      aria-live="polite"
    >
      เลือกวิธีแชร์ผลการทดสอบ
    </p>

  </section>
</dialog>


      <!-- ==================================================
           Privacy dialog
      =================================================== -->
      <dialog id="privacy">

        <div class="close-dialog">
          <img
            src="images/close-button.svg"
            alt="ปิด"
          />
        </div>

        <section>

          <h1>นโยบายความเป็นส่วนตัว</h1>

          <p>
            ระบบทดสอบความเร็วนี้อาจจัดเก็บข้อมูลผลการทดสอบ
            เมื่อเปิดใช้งานระบบ Telemetry
          </p>

          <h2>ข้อมูลที่อาจถูกจัดเก็บ</h2>

          <ul>
            <li>หมายเลขผลการทดสอบ</li>
            <li>วันและเวลาที่ทดสอบ</li>
            <li>ความเร็ว Download และ Upload</li>
            <li>ค่า Ping และ Jitter</li>
            <li>IP Address</li>
            <li>ข้อมูล Browser และอุปกรณ์</li>
          </ul>

          <h2>วัตถุประสงค์การใช้งาน</h2>

          <p>
            ข้อมูลถูกใช้สำหรับตรวจสอบและปรับปรุงประสิทธิภาพ
            ของเครือข่ายภายในองค์กร
          </p>

          <h2>การติดต่อ</h2>

          <p>
            ติดต่อผู้ดูแลระบบ:
            <a href="mailto:PUT@YOUR_EMAIL.HERE">
              TO BE FILLED BY DEVELOPER
            </a>
          </p>

        </section>

        <button id="close-privacy" type="button">
          ปิด
        </button>

      </dialog>

    </div>
  `;
})();