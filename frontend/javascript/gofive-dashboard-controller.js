/**
 * GoFive Dashboard Controller
 *
 * หน้าที่:
 * - ตรวจสอบ Browser, OS, Device และ Timezone
 * - แสดงข้อมูล Network Connection ที่ Browser อนุญาต
 * - อัปเดตวันและเวลา
 * - Synchronize ชื่อ Server
 * - แปลสถานะปุ่ม LibreSpeed เป็นภาษาไทย
 * - แสดง Test ID เมื่อ LibreSpeed สร้างผลทดสอบ
 *
 * ไม่แก้ไข LibreSpeed Engine
 */

(function () {
  "use strict";

  let currentTestState = "idle";
  let testStartedAt = null;

/**
* ค้นหา Element ด้วย ID
*
* @param {string} id
* @returns {HTMLElement|null}
*/
  function getElement(id) {
    return document.getElementById(id);
  }

  /**
   * กำหนดข้อความให้ Element อย่างปลอดภัย
   *
   * @param {string} id
   * @param {string} value
   */
  function setText(id, value) {
    const element = getElement(id);

    if (!element) {
      return;
    }

    element.textContent = value;
  }

/**
 * เพิ่มหรือลบ Class จาก Element
 *
 * @param {HTMLElement|null} element
 * @param {string} className
 * @param {boolean} enabled
*/
function toggleClass(element, className, enabled) {
  if (!element) {
    return;
  }

  element.classList.toggle(className, enabled);
}

  /**
   * ตรวจสอบ Browser จาก User Agent
   *
   * @returns {string}
   */
  function detectBrowser() {
    const userAgent = navigator.userAgent;

    if (/Edg\//i.test(userAgent)) {
      return "Microsoft Edge";
    }

    if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
      return "Opera";
    }

    if (/Firefox\//i.test(userAgent)) {
      return "Mozilla Firefox";
    }

    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
      return "Google Chrome";
    }

    if (
      /Safari\//i.test(userAgent) &&
      !/Chrome\//i.test(userAgent) &&
      !/Chromium\//i.test(userAgent)
    ) {
      return "Safari";
    }

    return "ไม่สามารถระบุได้";
  }

  /**
   * ตรวจสอบระบบปฏิบัติการ
   *
   * หมายเหตุ:
   * Browser รุ่นใหม่อาจลดรายละเอียดของ User Agent
   * จึงไม่สามารถแยก Windows 10 และ Windows 11 ได้อย่างแน่นอน
   *
   * @returns {string}
   */
  function detectOperatingSystem() {
    const userAgent = navigator.userAgent;
    const platform =
      navigator.userAgentData?.platform ||
      navigator.platform ||
      "";

    if (/Windows/i.test(platform) || /Windows NT/i.test(userAgent)) {
      return "Windows";
    }

    if (/Android/i.test(userAgent)) {
      return "Android";
    }

    if (
      /iPad/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
    ) {
      return "iPadOS";
    }

    if (/iPhone|iPod/i.test(userAgent)) {
      return "iOS";
    }

    if (/Mac/i.test(platform) || /Mac OS X/i.test(userAgent)) {
      return "macOS";
    }

    if (/Linux/i.test(platform) || /Linux/i.test(userAgent)) {
      return "Linux";
    }

    return "Unknown OS";
  }

  /**
   * ตรวจสอบประเภทอุปกรณ์
   *
   * @returns {string}
   */
  function detectDevice() {
    const userAgent = navigator.userAgent;
    const operatingSystem = detectOperatingSystem();

    if (/iPad/i.test(userAgent)) {
      return "iPad";
    }

    if (/iPhone|iPod/i.test(userAgent)) {
      return "iPhone";
    }

    if (/Android/i.test(userAgent)) {
      return /Mobile/i.test(userAgent)
        ? "Android Phone"
        : "Android Tablet";
    }

    if (
      /Macintosh/i.test(userAgent) &&
      navigator.maxTouchPoints > 1
    ) {
      return "iPad";
    }

    if (operatingSystem === "macOS") {
      return "Mac";
    }

    if (operatingSystem === "Windows") {
      return "Windows PC";
    }

    if (operatingSystem === "Linux") {
      return "Linux Computer";
    }

    return "Computer";
  }

  /**
   * ตรวจสอบ Timezone
   *
   * @returns {string}
   */
  function detectTimezone() {
    try {
      return (
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "ไม่สามารถระบุได้"
      );
    } catch (error) {
      console.warn(
        "GoFive Dashboard: Unable to detect timezone.",
        error
      );

      return "ไม่สามารถระบุได้";
    }
  }

  /**
   * อ่านประเภทการเชื่อมต่อที่ Browser เปิดเผย
   *
   * หมายเหตุ:
   * navigator.connection ไม่สามารถบอก Ethernet/Wi-Fi
   * ได้แน่นอนในทุก Browser
   *
   * @returns {string}
   */
  function detectConnectionType() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      return "ไม่สามารถระบุได้";
    }

    const connectionType = connection.type;
    const effectiveType = connection.effectiveType;

    const typeLabels = {
      ethernet: "Ethernet",
      wifi: "Wi-Fi",
      cellular: "Mobile Network",
      bluetooth: "Bluetooth",
      wimax: "WiMAX",
      other: "Other Network",
      unknown: "Unknown Network",
      none: "Offline"
    };

    if (connectionType && typeLabels[connectionType]) {
      return typeLabels[connectionType];
    }

    if (effectiveType) {
      return effectiveType.toUpperCase();
    }

    return "เชื่อมต่อเครือข่ายแล้ว";
  }

  /**
   * สร้างข้อความข้อมูล OS และ Browser
   *
   * @returns {string}
   */
  function getBrowserDisplay() {
    return `${detectBrowser()} · ${detectOperatingSystem()}`;
  }

/**
 * Format วันที่และเวลาจาก Date ที่ระบุ
 *
 * @param {Date} date
 * @returns {string}
 */
function formatSpecifiedDateTime(date) {
  try {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
  } catch (error) {
    return date.toLocaleString();
  }
}

  /**
   * Format วันและเวลาแบบไทย
   *
   * @returns {string}
   */
  function formatDateTime() {
    try {
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (error) {
      return new Date().toLocaleString();
    }
  }

  /**
   * อัปเดตวันและเวลา
   */
  function updateDateTime() {
    setText("test-date-time", formatDateTime());
  }

  /**
   * อัปเดตข้อมูลพื้นฐานของ Client
   */
  function updateClientInformation() {
    setText("client-device", detectDevice());
    setText("client-browser", getBrowserDisplay());
    setText("client-timezone", detectTimezone());
    setText("connection-type", detectConnectionType());

    /*
     * Browser ไม่สามารถอ่านชื่อเครื่อง, Windows Username
     * หรือ MAC Address ได้ด้วยเหตุผลด้านความปลอดภัย
     */
  }

  /**
   * แสดงสถานะ Network
   */
  function updateNetworkStatus() {
    if (navigator.onLine) {
      setText("client-network", "Internal Network");
      return;
    }

    setText("client-network", "Offline");
    setText("connection-type", "ไม่ได้เชื่อมต่อ");
  }

  /**
   * อ่านชื่อ Server ที่ LibreSpeed แสดงอยู่
   *
   * @returns {string}
   */
  function readSelectedServer() {
    const selectedServer = getElement("selected-server");

    if (!selectedServer) {
      return "";
    }

    return selectedServer.textContent.trim();
  }

  /**
   * Synchronize Server ไปยัง Information Bar
   */
  function syncSelectedServer() {
    const serverName = readSelectedServer();

    if (
      !serverName ||
      serverName === "กำลังค้นหาเซิร์ฟเวอร์..."
    ) {
      return;
    }

    setText("test-server-display", serverName);
  }

  /**
   * แปลข้อความปุ่มที่ LibreSpeed กำหนด
   *
   * @param {string} originalText
   * @returns {string}
   */
  function translateStartButtonText(originalText) {
    const normalizedText = originalText
      .trim()
      .toLowerCase();

    const translations = {
      "let's start": "เริ่มทดสอบ",
      "start": "เริ่มทดสอบ",
      "starting": "กำลังเริ่มทดสอบ...",
      "testing": "กำลังทดสอบ...",
      "restart": "ทดสอบอีกครั้ง",
      "abort": "ยกเลิกการทดสอบ",
      "cancel": "ยกเลิกการทดสอบ",
      "loading": "กำลังโหลด...",
      "select a server": "กรุณาเลือกเซิร์ฟเวอร์"
    };

    return translations[normalizedText] || originalText;
  }
  /**
 * อ่านค่าตัวเลขที่แสดงใน Element
 *
 * @param {HTMLElement|null} element
 * @returns {number}
 */
function readNumericValue(element) {
  if (!element) {
    return 0;
  }

  const matchedValue = element.textContent
    .replace(",", ".")
    .match(/-?\d+(?:\.\d+)?/);

  if (!matchedValue) {
    return 0;
  }

  const numericValue = Number(matchedValue[0]);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

/**
 * ตรวจสอบสถานะการทดสอบจากข้อความและ Class ของปุ่ม
 *
 * @returns {"idle"|"preparing"|"running"|"completed"}
 */
function detectTestState() {
  const startButton = getElement("start-button");

  if (!startButton) {
    return "idle";
  }

  const buttonText = startButton.textContent
    .trim()
    .toLowerCase();

  const buttonClasses = Array.from(
    startButton.classList
  )
    .join(" ")
    .toLowerCase();

  const combinedState = `${buttonText} ${buttonClasses}`;

  if (
    combinedState.includes("restart") ||
    combinedState.includes("ทดสอบอีกครั้ง")
  ) {
    return "completed";
  }

  if (
    combinedState.includes("testing") ||
    combinedState.includes("running") ||
    combinedState.includes("abort") ||
    combinedState.includes("cancel") ||
    combinedState.includes("กำลังทดสอบ") ||
    combinedState.includes("ยกเลิกการทดสอบ")
  ) {
    return "running";
  }

  if (
    combinedState.includes("starting") ||
    combinedState.includes("loading") ||
    combinedState.includes("initializing") ||
    combinedState.includes("กำลังเริ่ม") ||
    combinedState.includes("กำลังโหลด")
  ) {
    return "preparing";
  }

  return "idle";
}

/**
 * Synchronize ข้อความปุ่ม โดยไม่รบกวน Event Listener เดิม
 */
function syncStartButtonText() {
  const startButton = getElement("start-button");

  if (!startButton) {
    return;
  }

  const currentText = startButton.textContent.trim();

  const translatedText =
    translateStartButtonText(currentText);

  if (translatedText !== currentText) {
    startButton.textContent = translatedText;
  }

  /*
   * ตรวจสถานะหลังจากแปลข้อความแล้ว
   */
  syncTestState();
}

  /**
   * อ่าน Test ID จาก URL ของ Result Image
   *
   * LibreSpeed อาจสร้าง URL ลักษณะ:
   * results/?id=xxxxxxxx
   *
   * @returns {string}
   */
  function detectTestId() {
    const resultImage = getElement("results");

    if (!resultImage) {
      return "";
    }

    const source = resultImage.getAttribute("src");

    if (!source) {
      return "";
    }

    try {
      const resultUrl = new URL(
        source,
        window.location.href
      );

      return (
        resultUrl.searchParams.get("id") ||
        resultUrl.searchParams.get("testId") ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  /**
   * Synchronize Test ID
   */
  function syncTestId() {
    const testId = detectTestId();

    if (testId) {
      setText("test-id-display", testId);
    }
  }

  /**
   * อัปเดตปีใน Footer
   */
  function updateCurrentYear() {
    setText(
      "current-year",
      String(new Date().getFullYear())
    );
  }

/**
 * แยกข้อมูล IP และ ISP ที่ได้จาก LibreSpeed Backend
 *
 * รองรับ Response เช่น:
 *
 * {
 *   "processedString": "172.17.0.1",
 *   "rawIspInfo": ""
 * }
 *
 * รวมถึง Response แบบข้อความธรรมดา:
 *
 * 192.168.1.10
 * 192.168.1.10 - ISP Name
 *
 * @param {string} responseText
 * @returns {{ ip: string, isp: string }}
 */
function parseNetworkInformation(responseText) {
  const cleanedText = String(responseText || "")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (!cleanedText) {
    return {
      ip: "",
      isp: ""
    };
  }

  /*
   * ตรวจ JSON ก่อน เพราะ LibreSpeed getIP.php
   * อาจตอบ processedString และ rawIspInfo
   */
  if (
    cleanedText.startsWith("{") &&
    cleanedText.endsWith("}")
  ) {
    try {
      const jsonResponse = JSON.parse(cleanedText);

      const processedString = String(
        jsonResponse.processedString || ""
      ).trim();

      const rawIspInfo = String(
        jsonResponse.rawIspInfo || ""
      ).trim();

      /*
       * processedString บางระบบอาจมีทั้ง IP และ ISP:
       * 192.168.1.10 - ISP Name
       */
      if (processedString.includes(" - ")) {
        const separatorIndex =
          processedString.indexOf(" - ");

        return {
          ip: processedString
            .slice(0, separatorIndex)
            .trim(),

          isp:
            rawIspInfo ||
            processedString
              .slice(separatorIndex + 3)
              .trim()
        };
      }

      return {
        ip:
          processedString ||
          jsonResponse.ip ||
          jsonResponse.clientIp ||
          jsonResponse.address ||
          "",

        isp:
          rawIspInfo ||
          jsonResponse.isp ||
          jsonResponse.provider ||
          jsonResponse.organization ||
          ""
      };
    } catch (error) {
      console.warn(
        "GoFive Dashboard: Invalid JSON IP response.",
        error
      );
    }
  }

  /*
   * รองรับข้อความรูปแบบ:
   * IP - ISP
   */
  const separatorIndex = cleanedText.indexOf(" - ");

  if (separatorIndex !== -1) {
    return {
      ip: cleanedText
        .slice(0, separatorIndex)
        .trim(),

      isp: cleanedText
        .slice(separatorIndex + 3)
        .trim()
    };
  }

  /*
   * Response มีเฉพาะ IP
   */
  return {
    ip: cleanedText,
    isp: ""
  };
}

/**
 * ดึงข้อมูล IP และ ISP จาก LibreSpeed Backend
 *
 * Standalone PHP backend ใช้ endpoint:
 * backend/getIP.php
 */
async function loadNetworkInformation() {
  const clientIp = getElement("client-ip");
  const clientProvider = getElement("client-provider");

  if (clientIp) {
    clientIp.textContent = "กำลังตรวจสอบ...";
  }

  if (clientProvider) {
    clientProvider.textContent = "กำลังตรวจสอบ...";
  }

  try {
    const response = await fetch(
      `backend/getIP.php?t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "text/plain"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `IP endpoint returned HTTP ${response.status}`
      );
    }

    const responseText = (await response.text()).trim();

    if (!responseText) {
      throw new Error("IP endpoint returned an empty response");
    }

    const networkInformation =
      parseNetworkInformation(responseText);

    setText(
      "client-ip",
      networkInformation.ip || "ไม่สามารถระบุได้"
    );

    setText(
      "client-provider",
      networkInformation.isp || "GoFive Internal"
    );
  } catch (error) {
    console.warn(
      "GoFive Dashboard: Unable to retrieve IP information.",
      error
    );

    setText("client-ip", "ไม่สามารถระบุได้");
    setText("client-provider", "GoFive Internal");
  }
}

/**
 * Reset ข้อมูลสำหรับการทดสอบรอบใหม่
 */
function resetTestMetadata() {
  setText("test-id-display", "-");

  const shareButton = getElement("share-results");

  if (shareButton) {
    shareButton.classList.add("hidden");
  }
}

  /**
   * Observe การเปลี่ยนแปลงของ LibreSpeed UI
   */
  function observeLibreSpeedUi() {
    const startButton = getElement("start-button");
    const selectedServer = getElement("selected-server");
    const resultImage = getElement("results");

    if (startButton) {
    let buttonObserverScheduled = false;

    const buttonObserver = new MutationObserver(() => {
        /*
        * ป้องกัน MutationObserver Loop
        * เพราะ Controller มีการแก้ textContent ของปุ่ม
        */
        if (buttonObserverScheduled) {
        return;
        }

        buttonObserverScheduled = true;

        window.requestAnimationFrame(() => {
        buttonObserverScheduled = false;

        syncStartButtonText();
        syncTestState();
        });
    });

    buttonObserver.observe(startButton, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
        "class",
        "disabled",
        "aria-disabled"
        ]
    });
    }

    if (selectedServer) {
      const serverObserver = new MutationObserver(() => {
        syncSelectedServer();
      });

      serverObserver.observe(selectedServer, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    if (resultImage) {
      const resultObserver = new MutationObserver(() => {
        syncTestId();
      });

      resultObserver.observe(resultImage, {
        attributes: true,
        attributeFilter: ["src"]
      });
    }
    const downloadGauge = getElement("download-gauge");
    const uploadGauge = getElement("upload-gauge");

    const observeGaugeValue = (gaugeElement) => {
    if (!gaugeElement) {
        return;
    }

    const gaugeObserver = new MutationObserver(() => {
        const gaugeValue =
        readNumericValue(gaugeElement);

        /*
        * กรณี Engine เริ่มส่งค่าความเร็วแล้ว
        * แต่ข้อความปุ่มยังไม่เปลี่ยนทัน
        */
        if (
        gaugeValue > 0 &&
        currentTestState !== "completed"
        ) {
        applyTestState("running");
        }
    });

    gaugeObserver.observe(gaugeElement, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
    });
    };

    observeGaugeValue(downloadGauge);
    observeGaugeValue(uploadGauge);
  }

  /**
   * Observe Network Connection Change
   */
  function observeNetworkInformation() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    window.addEventListener("online", () => {
        updateNetworkStatus();

        setText(
            "connection-type",
            detectConnectionType()
        );

        loadNetworkInformation();
    });

    window.addEventListener("offline", () => {
      updateNetworkStatus();
    });

    if (
      connection &&
      typeof connection.addEventListener === "function"
    ) {
      connection.addEventListener("change", () => {
        setText(
          "connection-type",
          detectConnectionType()
        );
      });
    }
  }

  /**
   * เริ่มต้น Dashboard Controller
   */
  function initializeDashboardController() {
    updateClientInformation();
    updateNetworkStatus();
    updateCurrentYear();
    updateDateTime();
    loadNetworkInformation();
    applyTestState("idle");

    /*
     * index.js ถูกโหลดหลัง Controller
     * จึงรอให้ Controller ของ LibreSpeed เริ่มทำงานก่อนเล็กน้อย
     */
    window.setTimeout(() => {
        syncSelectedServer();
        syncStartButtonText();
        syncTestState();
        syncTestId();
        observeLibreSpeedUi();
    }, 100);;

    observeNetworkInformation();

    window.setInterval(updateDateTime, 1000);
  }


/**
 * ควบคุมการแสดง Ping และ Jitter
 *
 * ขณะยังไม่เริ่มทดสอบสามารถซ่อนไว้ได้
 * เมื่อเริ่มทดสอบให้แสดงตำแหน่งเดิมใน Grid
 *
 * @param {boolean} visible
 */
function setLatencyMetricsVisibility(visible) {
  const pingPanel = document.querySelector(
    ".gofive-result-layout .ping"
  );

  const jitterPanel = document.querySelector(
    ".gofive-result-layout .jitter"
  );

  if (pingPanel) {
    pingPanel.classList.toggle("hidden", !visible);
  }

  if (jitterPanel) {
    jitterPanel.classList.toggle("hidden", !visible);
  }
}

/**
 * นำสถานะ Test ไปใช้กับ Dashboard
 *
 * @param {"idle"|"preparing"|"running"|"completed"} nextState
 */
function applyTestState(nextState) {
  if (!nextState) {
    return;
  }

  const previousState = currentTestState;

  currentTestState = nextState;

  /*
   * เก็บสถานะไว้ที่ <body>
   * เพื่อให้ CSS เลือกแสดงผลตามสถานะได้
   */
  document.body.dataset.testState = nextState;

  document.body.classList.remove(
    "test-state-idle",
    "test-state-preparing",
    "test-state-running",
    "test-state-completed"
  );

  document.body.classList.add(
    `test-state-${nextState}`
  );

  const startButton = getElement("start-button");

  if (startButton) {
    startButton.setAttribute(
      "aria-busy",
      nextState === "preparing" ||
        nextState === "running"
        ? "true"
        : "false"
    );
  }

  /*
   * เริ่มรอบใหม่
   */
  if (
    (nextState === "preparing" ||
      nextState === "running") &&
    previousState !== "preparing" &&
    previousState !== "running"
  ) {
    testStartedAt = new Date();

    setText(
      "test-date-time",
      formatSpecifiedDateTime(testStartedAt)
    );

    resetTestMetadata();
    syncSelectedServer();
  }

  /*
   * แสดง Ping และ Jitter ระหว่างและหลังทดสอบ
   */
  setLatencyMetricsVisibility(
    nextState === "running" ||
      nextState === "completed"
  );

  /*
   * เมื่อทดสอบเสร็จให้อ่าน Test ID อีกครั้ง
   */
  if (nextState === "completed") {
    syncTestId();
    syncSelectedServer();
  }
}

/**
 * ตรวจสอบและ Synchronize Test State
 */
function syncTestState() {
  const detectedState = detectTestState();

  applyTestState(detectedState);
}
/**
 * ตรวจสอบและ Synchronize Test State
 */
function syncTestState() {
  const detectedState = detectTestState();

  applyTestState(detectedState);
}

/**
 * เริ่มต้น Dashboard Controller
 */
function initializeDashboardController() {
  updateClientInformation();
  updateNetworkStatus();
  updateCurrentYear();
  updateDateTime();
  loadNetworkInformation();
  applyTestState("idle");

  window.setTimeout(() => {
    syncSelectedServer();
    syncStartButtonText();
    syncTestState();
    syncTestId();
    observeLibreSpeedUi();
  }, 100);

  observeNetworkInformation();

  window.setInterval(updateDateTime, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDashboardController,
    { once: true }
  );
} else {
  initializeDashboardController();
}

})();