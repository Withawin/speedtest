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
   * เตรียมช่อง IP Address
   *
   * JavaScript ฝั่ง Browser ไม่สามารถค้นหา Public IP
   * ได้เองโดยไม่มี Backend หรือ API
   */
  function initializeIpAddress() {
    const clientIp = getElement("client-ip");

    if (!clientIp) {
      return;
    }

    if (
      clientIp.textContent.trim() === "กำลังตรวจสอบ..."
    ) {
      clientIp.textContent = "รอข้อมูลจากระบบ";
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
      const buttonObserver = new MutationObserver(() => {
        syncStartButtonText();
      });

      buttonObserver.observe(startButton, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
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
    initializeIpAddress();

    /*
     * index.js ถูกโหลดหลัง Controller
     * จึงรอให้ Controller ของ LibreSpeed เริ่มทำงานก่อนเล็กน้อย
     */
    window.setTimeout(() => {
      syncSelectedServer();
      syncStartButtonText();
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