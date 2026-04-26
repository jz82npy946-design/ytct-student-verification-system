const STORAGE_KEYS = {
  standard: "ytct-verification:standardStudents:v1",
  check: "ytct-verification:checkStudents:v1",
  result: "ytct-verification:verificationResults:v1",
  importErrors: "ytct-verification:importErrors:v1",
  settings: "ytct-verification:settings:v1",
  audit: "ytct-verification:audit:v1"
};

const AUTH_KEY = "ytct-verification:auth";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LOGIN_ACCOUNT = {
  username: "admin",
  passwordHash: "a6b8177119933825349509963453118cbb85441bba8d32fa8a6a79c2e21947fa",
  fallbackPasswordCodes: [89, 84, 67, 84, 64, 50, 48, 50, 54]
};

const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const BANK_CARD_PATTERN = /^\d{12,30}$/;
const REQUIRED_HEADERS = ["姓名", "学号", "性别", "班级", "联系方式", "身份证号", "银行卡号"];
const OPTIONAL_HEADERS = ["年龄", "家庭住址", "开户银行", "资助项目", "资助金额", "备注"];
const CORE_FIELDS = [
  ["name", "姓名"],
  ["gender", "性别"],
  ["age", "年龄"],
  ["className", "班级"],
  ["phone", "联系方式"],
  ["idCard", "身份证号"],
  ["bankCard", "银行卡号"],
  ["bankName", "开户银行"],
  ["aidProject", "资助项目"],
  ["aidAmount", "资助金额"],
  ["address", "家庭住址"]
];
const DEFAULT_COMPARE_FIELDS = CORE_FIELDS.map(([field]) => field);
const SENSITIVE_FIELDS = new Set(["idCard", "bankCard"]);
const TEMPLATE_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

const sampleStandardStudents = [
  {
    id: crypto.randomUUID(),
    name: "李明",
    studentNo: "2026001",
    gender: "男",
    age: "18",
    className: "旅游管理一班",
    phone: "13800000001",
    idCard: "370602200801010010",
    bankCard: "6222020200010000001",
    bankName: "中国工商银行烟台分行",
    aidProject: "国家助学金",
    aidAmount: "3300",
    address: "山东省烟台市莱山区",
    remark: "",
    createdAt: Date.now() - 300000
  },
  {
    id: crypto.randomUUID(),
    name: "王雨晴",
    studentNo: "2026002",
    gender: "女",
    age: "19",
    className: "酒店管理一班",
    phone: "13800000002",
    idCard: "370602200702020029",
    bankCard: "6228480200010000002",
    bankName: "中国农业银行烟台分行",
    aidProject: "学院困难补助",
    aidAmount: "1200",
    address: "山东省烟台市芝罘区",
    remark: "",
    createdAt: Date.now() - 200000
  },
  {
    id: crypto.randomUUID(),
    name: "张浩",
    studentNo: "2026003",
    gender: "男",
    age: "18",
    className: "文化创意二班",
    phone: "13800000003",
    idCard: "370602200803030031",
    bankCard: "6217000200010000003",
    bankName: "中国建设银行烟台分行",
    aidProject: "国家助学金",
    aidAmount: "3300",
    address: "山东省烟台市福山区",
    remark: "",
    createdAt: Date.now() - 100000
  }
];

let standardStudents = loadList(STORAGE_KEYS.standard, sampleStandardStudents);
let checkStudents = loadList(STORAGE_KEYS.check, []);
let verificationResults = loadResults();
let importErrors = loadImportErrors();
let settings = loadSettings();
let auditLog = loadAuditLog();
let activeView = "standard";
let editingDataset = "standard";
let pendingDelete = null;
let deferredInstallPrompt = null;

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  installPrompt: document.querySelector("#installPrompt"),
  installBtn: document.querySelector("#installBtn"),
  dismissInstallBtn: document.querySelector("#dismissInstallBtn"),
  form: document.querySelector("#studentForm"),
  studentId: document.querySelector("#studentId"),
  formTitle: document.querySelector("#formTitle"),
  editingNotice: document.querySelector("#editingNotice"),
  submitBtn: document.querySelector("#submitBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  table: document.querySelector("#studentTable"),
  tableHead: document.querySelector("#tableHead"),
  dataTable: document.querySelector("#dataTable"),
  cards: document.querySelector("#studentCards"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyText: document.querySelector("#emptyText"),
  searchInput: document.querySelector("#searchInput"),
  clearSearchBtn: document.querySelector("#clearSearchBtn"),
  classFilter: document.querySelector("#classFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  totalCount: document.querySelector("#totalCount"),
  passCount: document.querySelector("#passCount"),
  issueCount: document.querySelector("#issueCount"),
  duplicateCount: document.querySelector("#duplicateCount"),
  standardImportFile: document.querySelector("#standardImportFile"),
  checkImportFile: document.querySelector("#checkImportFile"),
  backupImportFile: document.querySelector("#backupImportFile"),
  downloadStandardTemplateBtn: document.querySelector("#downloadStandardTemplateBtn"),
  downloadCheckTemplateBtn: document.querySelector("#downloadCheckTemplateBtn"),
  compareBtn: document.querySelector("#compareBtn"),
  exportResultBtn: document.querySelector("#exportResultBtn"),
  exportBackupBtn: document.querySelector("#exportBackupBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  privacyToggle: document.querySelector("#privacyToggle"),
  rulePanel: document.querySelector("#rulePanel"),
  confirmModal: document.querySelector("#confirmModal"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmDeleteBtn: document.querySelector("#confirmDeleteBtn"),
  cancelDeleteBtn: document.querySelector("#cancelDeleteBtn"),
  toast: document.querySelector("#toast")
};

elements.loginForm.addEventListener("submit", handleLogin);
elements.logoutBtn.addEventListener("click", logout);
elements.installBtn.addEventListener("click", installPwa);
elements.dismissInstallBtn.addEventListener("click", dismissInstallPrompt);
elements.form.addEventListener("submit", handleSubmit);
elements.form.addEventListener("input", clearFieldError);
elements.form.addEventListener("change", clearFieldError);
elements.cancelEditBtn.addEventListener("click", resetForm);
elements.searchInput.addEventListener("input", () => {
  updateSearchClear();
  render();
});
elements.clearSearchBtn.addEventListener("click", clearSearch);
elements.classFilter.addEventListener("change", render);
elements.sortSelect.addEventListener("change", render);
elements.standardImportFile.addEventListener("change", (event) => importExcel(event, "standard"));
elements.checkImportFile.addEventListener("change", (event) => importExcel(event, "check"));
elements.backupImportFile.addEventListener("change", importBackup);
elements.downloadStandardTemplateBtn.addEventListener("click", () => downloadTemplate("standard"));
elements.downloadCheckTemplateBtn.addEventListener("click", () => downloadTemplate("check"));
elements.compareBtn.addEventListener("click", runVerification);
elements.exportResultBtn.addEventListener("click", exportResults);
elements.exportBackupBtn.addEventListener("click", exportBackup);
elements.resetBtn.addEventListener("click", resetAllData);
elements.confirmDeleteBtn.addEventListener("click", confirmDeleteStudent);
elements.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
elements.privacyToggle.addEventListener("change", updatePrivacySetting);
elements.rulePanel.addEventListener("change", updateCompareFields);
elements.confirmModal.addEventListener("click", (event) => {
  if (event.target === elements.confirmModal) closeDeleteModal();
});
document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installPrompt.classList.remove("hidden");
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  elements.installPrompt.classList.add("hidden");
  showToast("应用已安装到桌面");
});
window.addEventListener("load", () => {
  window.setTimeout(() => {
    if (!window.XLSX) showToast("Excel 解析库未加载，导入 Excel 和导出 Excel 会受影响，可先使用 CSV 导出");
  }, 1200);
});

initAuth();
renderRulePanel();
render();

async function installPwa() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  elements.installPrompt.classList.add("hidden");
}

function dismissInstallPrompt() {
  elements.installPrompt.classList.add("hidden");
}

function initAuth() {
  const auth = getAuthSession();
  const authed = auth.authed && auth.expiresAt > Date.now();
  if (!authed) sessionStorage.removeItem(AUTH_KEY);
  elements.loginScreen.classList.toggle("hidden", authed);
  elements.appShell.classList.toggle("hidden", !authed);
  elements.privacyToggle.checked = settings.maskSensitive;
  if (!authed) {
    elements.loginUsername.focus();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = clean(elements.loginUsername.value);
  const password = elements.loginPassword.value;
  const passwordHash = await sha256Hex(password);
  const valid = username === LOGIN_ACCOUNT.username &&
    (passwordHash === LOGIN_ACCOUNT.passwordHash || password === fallbackPassword());

  if (!valid) {
    elements.loginError.classList.remove("hidden");
    elements.loginPassword.value = "";
    elements.loginPassword.focus();
    return;
  }

  refreshAuthSession();
  elements.loginError.classList.add("hidden");
  elements.loginForm.reset();
  initAuth();
  recordAudit("登录系统", "管理员进入本地核验系统");
  showToast("登录成功，欢迎进入系统");
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  resetForm();
  initAuth();
  recordAudit("退出登录", "管理员退出系统");
  showToast("已退出登录");
}

function getAuthSession() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "{}");
    return {
      authed: parsed.authed === true,
      expiresAt: Number(parsed.expiresAt) || 0
    };
  } catch {
    return { authed: false, expiresAt: 0 };
  }
}

function refreshAuthSession() {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({
    authed: true,
    expiresAt: Date.now() + SESSION_TIMEOUT_MS
  }));
}

async function sha256Hex(value) {
  if (!window.crypto?.subtle) return "";
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fallbackPassword() {
  return String.fromCharCode(...LOGIN_ACCOUNT.fallbackPasswordCodes);
}

function loadList(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback.map(normalizeStudent);
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeStudent) : fallback.map(normalizeStudent);
  } catch {
    return fallback.map(normalizeStudent);
  }
}

function loadResults() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.result) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeResult) : [];
  } catch {
    return [];
  }
}

function loadImportErrors() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.importErrors) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettings() {
  const fallback = {
    maskSensitive: true,
    compareFields: DEFAULT_COMPARE_FIELDS
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}");
    const compareFields = Array.isArray(parsed.compareFields)
      ? parsed.compareFields.filter((field) => DEFAULT_COMPARE_FIELDS.includes(field))
      : fallback.compareFields;
    return {
      ...fallback,
      ...parsed,
      compareFields: compareFields.length > 0 ? compareFields : fallback.compareFields,
      maskSensitive: parsed.maskSensitive !== false
    };
  } catch {
    return fallback;
  }
}

function loadAuditLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.standard, JSON.stringify(standardStudents));
  localStorage.setItem(STORAGE_KEYS.check, JSON.stringify(checkStudents));
  localStorage.setItem(STORAGE_KEYS.result, JSON.stringify(verificationResults));
  localStorage.setItem(STORAGE_KEYS.importErrors, JSON.stringify(importErrors));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(auditLog.slice(-300)));
}

function handleSubmit(event) {
  event.preventDefault();
  const student = getFormStudent();
  const target = elements.studentId.value ? editingDataset : "standard";
  const isEditing = Boolean(elements.studentId.value);
  const errors = validateStudent(student, getDataset(target), elements.studentId.value);

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    showToast("校验失败，请先修正表单中的错误");
    return;
  }

  if (target === "standard") {
    standardStudents = upsertStudent(standardStudents, student);
  } else {
    checkStudents = upsertStudent(checkStudents, student);
  }

  verificationResults = [];
  importErrors = [];
  saveAll();
  resetForm();
  activeView = target;
  syncTabs();
  render();
  recordAudit(isEditing ? "编辑学生信息" : "新增学生信息", `${student.name}（${student.studentNo}）`);
  showToast(isEditing ? "编辑成功" : "新增成功，已添加到学生库");
}

function getFormStudent() {
  const formData = new FormData(elements.form);
  const currentId = elements.studentId.value;
  return normalizeStudent({
    id: currentId || crypto.randomUUID(),
    name: formData.get("name"),
    studentNo: formData.get("studentNo"),
    gender: formData.get("gender"),
    age: formData.get("age"),
    className: formData.get("className"),
    phone: formData.get("phone"),
    idCard: formData.get("idCard"),
    bankCard: formData.get("bankCard"),
    bankName: formData.get("bankName"),
    aidProject: formData.get("aidProject"),
    aidAmount: formData.get("aidAmount"),
    address: formData.get("address"),
    remark: formData.get("remark"),
    createdAt: currentId
      ? getDataset(editingDataset).find((item) => item.id === currentId)?.createdAt || Date.now()
      : Date.now()
  });
}

function upsertStudent(list, student) {
  if (!elements.studentId.value) return [student, ...list];
  return list.map((item) => (item.id === student.id ? student : item));
}

function validateStudent(student, list, currentId = "") {
  const errors = {};
  if (!student.name) errors.name = "请输入姓名";
  if (!student.studentNo) errors.studentNo = "请输入学号";
  if (!student.gender) {
    errors.gender = "请选择性别";
  } else if (!["男", "女"].includes(student.gender)) {
    errors.gender = "性别必须为男或女";
  }
  if (!student.className) errors.className = "请输入班级";
  if (!student.phone) {
    errors.phone = "请输入联系方式";
  } else if (!PHONE_PATTERN.test(student.phone)) {
    errors.phone = "联系方式建议为 11 位手机号";
  }
  if (student.age && !isValidAge(student.age)) {
    errors.age = "年龄必须是合理数字";
  }
  if (!student.idCard) {
    errors.idCard = "请输入身份证号";
  } else if (!isValidIdCard(student.idCard)) {
    errors.idCard = "身份证号格式不正确";
  }
  if (!student.bankCard) {
    errors.bankCard = "请输入银行卡号";
  } else if (!BANK_CARD_PATTERN.test(student.bankCard)) {
    errors.bankCard = "银行卡号需为 12-30 位数字";
  }
  if (student.aidAmount && !isValidAmount(student.aidAmount)) {
    errors.aidAmount = "资助金额必须是非负数字";
  }

  const duplicate = list.some((item) => item.studentNo === student.studentNo && item.id !== currentId);
  if (duplicate) errors.studentNo = "该学号已存在";
  return errors;
}

function importExcel(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  if (!window.XLSX) {
    showToast("Excel 解析库加载失败，请检查网络或改用本地 xlsx 文件");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("Excel 文件中没有工作表");

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
        defval: "",
        raw: false
      });
      const imported = parseExcelRows(rows);
      let changed = true;

      importErrors = collectImportErrors(imported, type);

      if (type === "standard") {
        changed = handleStandardImport(imported);
      } else {
        checkStudents = imported;
        activeView = "check";
        showToast(`导入成功，待核对表共 ${imported.length} 条，格式异常 ${importErrors.length} 项`);
      }

      if (!changed) return;

      verificationResults = [];
      saveAll();
      resetForm();
      syncTabs();
      render();
      recordAudit(type === "standard" ? "导入标准学生库" : "导入待核对表", `导入 ${imported.length} 条，发现 ${importErrors.length} 项导入错误`);
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleStandardImport(imported) {
  if (standardStudents.length === 0) {
    const result = filterImportableStudents(imported);
    standardStudents = result.validStudents;
    activeView = "standard";
    showToast(`导入成功，新增 ${result.validStudents.length} 条，格式异常 ${result.invalidCount} 条`);
    return true;
  }

  const mode = window.prompt(
    [
      "当前标准学生库已有数据，请选择导入方式：",
      "1. 合并导入：保留现有数据，重复学号自动跳过",
      "2. 覆盖导入：清空当前标准学生库后导入",
      "3. 取消导入",
      "请输入 1、2 或 3"
    ].join("\n")
  );

  if (mode === null || clean(mode) === "" || clean(mode) === "3") {
    showToast("已取消导入，标准学生库未修改");
    return false;
  }

  if (clean(mode) === "1") {
    mergeStandardStudents(imported);
    return true;
  }

  if (clean(mode) === "2") {
    const confirmed = window.confirm("覆盖导入会清空当前手动新增和已有学生库数据，是否继续？");
    if (!confirmed) {
      showToast("已取消覆盖导入，标准学生库未修改");
      return false;
    }
    const result = filterImportableStudents(imported);
    standardStudents = result.validStudents;
    activeView = "standard";
    showToast(`覆盖导入完成，导入 ${result.validStudents.length} 条，格式异常 ${result.invalidCount} 条`);
    return true;
  }

  showToast("未识别导入方式，已取消导入");
  return false;
}

function mergeStandardStudents(imported) {
  const existingNos = new Set(standardStudents.map((student) => student.studentNo).filter(Boolean));
  let addedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;

  imported.forEach((student) => {
    if (hasImportFormatIssue(student)) {
      invalidCount += 1;
      return;
    }

    if (existingNos.has(student.studentNo)) {
      skippedCount += 1;
      return;
    }

    standardStudents.unshift(student);
    existingNos.add(student.studentNo);
    addedCount += 1;
  });

  activeView = "standard";
  showToast(`合并导入完成：成功新增 ${addedCount} 条，跳过重复 ${skippedCount} 条，格式异常 ${invalidCount} 条`);
}

function filterImportableStudents(imported) {
  const validStudents = [];
  let invalidCount = 0;

  imported.forEach((student) => {
    if (hasImportFormatIssue(student)) {
      invalidCount += 1;
      return;
    }
    validStudents.push(student);
  });

  return { validStudents, invalidCount };
}

function hasImportFormatIssue(student) {
  if (!student.name || !student.studentNo || !student.gender || !student.className || !student.phone || !student.idCard || !student.bankCard) {
    return true;
  }
  if (!["男", "女"].includes(student.gender)) {
    return true;
  }
  if (student.age && !isValidAge(student.age)) {
    return true;
  }
  if (!PHONE_PATTERN.test(student.phone)) {
    return true;
  }
  if (!isValidIdCard(student.idCard)) {
    return true;
  }
  if (!BANK_CARD_PATTERN.test(student.bankCard)) {
    return true;
  }
  return Boolean(student.aidAmount && !isValidAmount(student.aidAmount));
}

function collectImportErrors(students, type) {
  return students.flatMap((student) => {
    const errors = [];
    if (!student.studentNo) {
      errors.push({ field: "学号", message: "学号为空，无法作为核验匹配依据" });
    }
    errors.push(...getFormatErrors(student));
    return errors.map((error) => ({
      id: crypto.randomUUID(),
      dataset: type === "standard" ? "标准学生库" : "待核对表",
      rowNumber: student._rowNumber || "",
      studentNo: student.studentNo,
      name: student.name,
      field: error.field,
      value: getFieldValueByLabel(student, error.field),
      message: error.message,
      createdAt: Date.now()
    }));
  });
}

function parseExcelRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("表格为空");
  }

  const headers = Object.keys(rows[0]).map(clean);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`表头缺少：${missing.join("、")}`);
  }

  const validHeaders = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
  const imported = rows
    .map((row, index) => {
      const normalizedRow = {};
      validHeaders.forEach((header) => {
        normalizedRow[header] = clean(row[header]);
      });
      const student = normalizeStudent({
        id: crypto.randomUUID(),
        name: normalizedRow["姓名"],
        studentNo: normalizedRow["学号"],
        gender: normalizedRow["性别"],
        age: normalizedRow["年龄"],
        className: normalizedRow["班级"],
        phone: normalizedRow["联系方式"],
        idCard: normalizedRow["身份证号"],
        bankCard: normalizedRow["银行卡号"],
        bankName: normalizedRow["开户银行"],
        aidProject: normalizedRow["资助项目"],
        aidAmount: normalizedRow["资助金额"],
        address: normalizedRow["家庭住址"],
        remark: normalizedRow["备注"],
        createdAt: Date.now()
      });
      student._rowNumber = index + 2;
      return student;
    })
    .filter((student) => Object.values(pickStudentFields(student)).some(Boolean));

  if (imported.length === 0) {
    throw new Error("表格没有可导入的学生数据");
  }
  return imported;
}

function runVerification() {
  if (standardStudents.length === 0) {
    showToast("请先导入或添加标准学生库");
    return;
  }
  if (checkStudents.length === 0) {
    showToast("请先导入待核对表");
    return;
  }

  verificationResults = buildVerificationResults();
  activeView = "result";
  saveAll();
  syncTabs();
  render();
  recordAudit("执行自动比对", `生成 ${verificationResults.length} 条核对结果`);
  showToast("自动比对完成");
}

function buildVerificationResults() {
  const results = [];
  const standardMap = new Map();
  const checkNoCounts = countStudentNos(checkStudents);
  const standardNoCounts = countStudentNos(standardStudents);

  standardStudents.forEach((student) => {
    if (student.studentNo && !standardMap.has(student.studentNo)) {
      standardMap.set(student.studentNo, student);
    }
  });

  checkStudents.forEach((student) => {
    const base = resultBase(student);
    const formatErrors = getFormatErrors(student);

    if (!student.studentNo) {
      results.push(makeResult(base, "无效数据", "学号", "学号为空，无法按学号进行核验"));
      return;
    }

    if (checkNoCounts.get(student.studentNo) > 1) {
      results.push(makeResult(
        base,
        "重复学号",
        "学号",
        `学号重复：该学号在待核对表中出现 ${checkNoCounts.get(student.studentNo)} 次`
      ));
      return;
    }

    if (formatErrors.length > 0) {
      results.push(makeResult(base, "格式异常", formatErrors.map((item) => item.field).join("、"), formatErrors.map((item) => item.message).join("；")));
      return;
    }

    if (!standardMap.has(student.studentNo)) {
      results.push(makeResult(base, "未录入学生", "学号", "待核对表中的学号在标准学生库中不存在"));
      return;
    }

    const standard = standardMap.get(student.studentNo);
    const diffs = CORE_FIELDS
      .filter(([field]) => settings.compareFields.includes(field))
      .filter(([field]) => clean(standard[field]) !== clean(student[field]))
      .map(([field, label]) => `${label}不一致：标准库为 ${displayFieldValue(field, standard[field])}，待核对表为 ${displayFieldValue(field, student[field])}`);

    if (diffs.length > 0) {
      results.push(makeResult(base, "信息不一致", getDiffFieldLabels(diffs), diffs.join("；")));
      return;
    }

    results.push(makeResult(base, "通过", "", "已选核验字段一致"));
  });

  standardStudents.forEach((student) => {
    if (!student.studentNo) return;
    const missingInCheck = !checkStudents.some((item) => item.studentNo === student.studentNo);
    if (missingInCheck && standardNoCounts.get(student.studentNo) === 1) {
      results.push(makeResult(resultBase(student), "待核对表缺失", "学号", "标准学生库中存在该学生，待核对表中未找到对应学号"));
    }
  });

  standardNoCounts.forEach((count, studentNo) => {
    if (studentNo && count > 1) {
      const student = standardStudents.find((item) => item.studentNo === studentNo);
      results.push(makeResult(resultBase(student), "重复学号", "学号", `学号重复：该学号在标准学生库中出现 ${count} 次`));
    }
  });

  return results.map((item, index) => normalizeResult({ ...item, id: `${Date.now()}-${index}` }));
}

function getFormatErrors(student) {
  const errors = [];
  if (!student.name) {
    errors.push({ field: "姓名", message: "姓名为空" });
  }
  if (student.gender && !["男", "女"].includes(student.gender)) {
    errors.push({ field: "性别", message: `性别格式异常：${student.gender}` });
  } else if (!student.gender) {
    errors.push({ field: "性别", message: "性别为空" });
  }
  if (student.age && !isValidAge(student.age)) {
    errors.push({ field: "年龄", message: `年龄格式异常：${student.age}` });
  }
  if (!student.className) {
    errors.push({ field: "班级", message: "班级为空" });
  }
  if (!student.phone) {
    errors.push({ field: "联系方式", message: "联系方式为空" });
  } else if (!PHONE_PATTERN.test(student.phone)) {
    errors.push({ field: "联系方式", message: `联系方式格式异常：${student.phone}` });
  }
  if (!student.idCard) {
    errors.push({ field: "身份证号", message: "身份证号为空" });
  } else if (!isValidIdCard(student.idCard)) {
    errors.push({ field: "身份证号", message: `身份证号格式异常：${student.idCard}` });
  }
  if (!student.bankCard) {
    errors.push({ field: "银行卡号", message: "银行卡号为空" });
  } else if (!BANK_CARD_PATTERN.test(student.bankCard)) {
    errors.push({ field: "银行卡号", message: "银行卡号需为 12-30 位数字" });
  }
  if (student.aidAmount && !isValidAmount(student.aidAmount)) {
    errors.push({ field: "资助金额", message: `资助金额格式异常：${student.aidAmount}` });
  }
  return errors;
}

function makeResult(base, status, fields, detail) {
  return { ...base, status, fields, detail };
}

function resultBase(student) {
  return {
    studentNo: student?.studentNo || "",
    name: student?.name || "",
    className: student?.className || "",
    phone: student?.phone || "",
    idCard: student?.idCard || "",
    bankCard: student?.bankCard || "",
    bankName: student?.bankName || "",
    aidProject: student?.aidProject || "",
    aidAmount: student?.aidAmount || ""
  };
}

function getDiffFieldLabels(diffs) {
  return diffs.map((text) => text.split("不一致")[0]).join("、");
}

function countStudentNos(list) {
  const counts = new Map();
  list.forEach((student) => {
    if (!student.studentNo) return;
    counts.set(student.studentNo, (counts.get(student.studentNo) || 0) + 1);
  });
  return counts;
}

function switchView(view) {
  activeView = view;
  resetForm();
  syncTabs();
  render();
}

function syncTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
}

function render() {
  if (getAuthSession().authed) refreshAuthSession();
  updateClassFilter();
  const rows = getVisibleRows();
  renderTable(rows);
  renderCards(rows);
  renderStats();
  renderEmptyState(rows);
  updateSearchClear();
}

function getVisibleRows() {
  const keyword = elements.searchInput.value.trim().toLowerCase();
  const className = elements.classFilter.value;
  const [field, direction] = elements.sortSelect.value.split("-");
  const rows = getActiveRows();

  return rows
    .filter((row) => {
      const searchable = [
        row.name,
        row.studentNo,
        row.className,
        row.phone,
        row.idCard,
        row.bankCard,
        row.bankName,
        row.aidProject,
        row.aidAmount,
        row.dataset,
        row.field,
        row.value,
        row.message,
        row.rowNumber,
        row.status,
        row.fields,
        row.detail
      ].join(" ").toLowerCase();
      return (!keyword || searchable.includes(keyword)) &&
        (!className || row.className === className);
    })
    .sort((a, b) => compareRows(a, b, field, direction));
}

function getActiveRows() {
  if (activeView === "standard") return standardStudents;
  if (activeView === "check") return checkStudents;
  if (activeView === "importErrors") return importErrors;
  return verificationResults;
}

function compareRows(a, b, field, direction) {
  const factor = direction === "asc" ? 1 : -1;
  if (field === "createdAt") {
    return ((a.createdAt || 0) - (b.createdAt || 0)) * factor;
  }
  return String(a[field] || "").localeCompare(String(b[field] || ""), "zh-CN") * factor;
}

function renderTable(rows) {
  elements.dataTable.className = activeView === "result" ? "result-table" : activeView === "importErrors" ? "error-table" : "student-data-table";
  if (activeView === "result") {
    elements.tableHead.innerHTML = `
      <tr>
        <th>学号</th>
        <th>姓名</th>
        <th>班级</th>
        <th>身份证号</th>
        <th>银行卡号</th>
        <th>资助金额</th>
        <th>核对状态</th>
        <th>处理状态</th>
        <th>异常字段</th>
        <th>详情</th>
        <th>操作</th>
      </tr>
    `;
    elements.table.innerHTML = rows.map(renderResultRow).join("");
  } else if (activeView === "importErrors") {
    elements.tableHead.innerHTML = `
      <tr>
        <th>来源</th>
        <th>行号</th>
        <th>学号</th>
        <th>姓名</th>
        <th>字段</th>
        <th>当前值</th>
        <th>错误说明</th>
      </tr>
    `;
    elements.table.innerHTML = rows.map(renderImportErrorRow).join("");
  } else {
    elements.tableHead.innerHTML = `
      <tr>
        <th>姓名</th>
        <th>学号</th>
        <th>性别</th>
        <th>年龄</th>
        <th>班级</th>
        <th>身份证号</th>
        <th>银行卡号</th>
        <th>开户银行</th>
        <th>资助项目</th>
        <th>资助金额</th>
        <th>联系方式</th>
        <th>家庭住址</th>
        <th>备注</th>
        <th>操作</th>
      </tr>
    `;
    elements.table.innerHTML = rows.map(renderStudentRow).join("");
  }
  bindActionButtons(elements.table);
}

function renderStudentRow(student) {
  return `
    <tr>
      <td><span class="student-name">${escapeHtml(student.name)}</span></td>
      <td>${escapeHtml(student.studentNo)}</td>
      <td>${escapeHtml(student.gender)}</td>
      <td>${escapeHtml(student.age || "未填")}</td>
      <td>${escapeHtml(student.className)}</td>
      <td title="${escapeHtml(student.idCard)}">${escapeHtml(maskIdCard(student.idCard) || "未填写")}</td>
      <td title="${escapeHtml(student.bankCard)}">${escapeHtml(maskBankCard(student.bankCard) || "未填写")}</td>
      <td>${escapeHtml(student.bankName || "未填写")}</td>
      <td>${escapeHtml(student.aidProject || "未填写")}</td>
      <td>${escapeHtml(formatAmount(student.aidAmount) || "未填写")}</td>
      <td>${escapeHtml(student.phone)}</td>
      <td>${escapeHtml(student.address || "未填写")}</td>
      <td>${escapeHtml(student.remark || "无")}</td>
      <td>${actionButtons(student.id)}</td>
    </tr>
  `;
}

function renderResultRow(result) {
  return `
    <tr>
      <td>${escapeHtml(result.studentNo || "未填写")}</td>
      <td>${escapeHtml(result.name || "未填写")}</td>
      <td>${escapeHtml(result.className || "未填写")}</td>
      <td title="${escapeHtml(result.idCard)}">${escapeHtml(maskIdCard(result.idCard) || "未填写")}</td>
      <td title="${escapeHtml(result.bankCard)}">${escapeHtml(maskBankCard(result.bankCard) || "未填写")}</td>
      <td>${escapeHtml(formatAmount(result.aidAmount) || "未填写")}</td>
      <td><span class="status-pill ${statusClass(result.status)}">${escapeHtml(result.status)}</span></td>
      <td>${renderProcessState(result)}</td>
      <td>${escapeHtml(result.fields || "-")}</td>
      <td title="${escapeHtml(result.detail)}">${escapeHtml(result.detail)}</td>
      <td>
        <div class="row-actions">
          <button class="btn small-btn" type="button" data-action="locate" data-id="${escapeHtml(result.studentNo)}">定位</button>
          <button class="btn small-btn edit" type="button" data-action="process" data-id="${escapeHtml(result.id)}">${result.processed ? "改备注" : "标记处理"}</button>
        </div>
      </td>
    </tr>
  `;
}

function renderImportErrorRow(error) {
  return `
    <tr>
      <td>${escapeHtml(error.dataset || "-")}</td>
      <td>${escapeHtml(error.rowNumber || "-")}</td>
      <td>${escapeHtml(error.studentNo || "未填写")}</td>
      <td>${escapeHtml(error.name || "未填写")}</td>
      <td>${escapeHtml(error.field || "-")}</td>
      <td title="${escapeHtml(error.value || "")}">${escapeHtml(error.value || "空")}</td>
      <td title="${escapeHtml(error.message || "")}">${escapeHtml(error.message || "-")}</td>
    </tr>
  `;
}

function renderCards(rows) {
  if (activeView === "result") {
    elements.cards.innerHTML = rows.map((result) => `
      <article class="student-card">
        <div class="card-top">
          <div>
            <span class="student-name">${escapeHtml(result.name || "未填写姓名")}</span>
            <span class="student-sub">${escapeHtml(result.studentNo || "未填写学号")} · ${escapeHtml(result.className || "未填写班级")}</span>
          </div>
          <span class="status-pill ${statusClass(result.status)}">${escapeHtml(result.status)}</span>
        </div>
        <div class="card-grid">
          <span>联系方式<strong>${escapeHtml(result.phone || "未填写")}</strong></span>
          <span>身份证号<strong>${escapeHtml(maskIdCard(result.idCard) || "未填写")}</strong></span>
          <span>银行卡号<strong>${escapeHtml(maskBankCard(result.bankCard) || "未填写")}</strong></span>
          <span>资助金额<strong>${escapeHtml(formatAmount(result.aidAmount) || "未填写")}</strong></span>
          <span>异常字段<strong>${escapeHtml(result.fields || "-")}</strong></span>
          <span>处理状态<strong>${escapeHtml(result.processed ? "已处理" : "未处理")}</strong></span>
          <span class="wide-card">详情<strong>${escapeHtml(result.detail)}</strong></span>
          ${result.processedNote ? `<span class="wide-card">处理备注<strong>${escapeHtml(result.processedNote)}</strong></span>` : ""}
        </div>
      </article>
    `).join("");
    bindActionButtons(elements.cards);
    return;
  }

  if (activeView === "importErrors") {
    elements.cards.innerHTML = rows.map((error) => `
      <article class="student-card">
        <div class="card-top">
          <div>
            <span class="student-name">${escapeHtml(error.field || "导入错误")}</span>
            <span class="student-sub">${escapeHtml(error.dataset || "-")} · 第 ${escapeHtml(error.rowNumber || "-")} 行</span>
          </div>
        </div>
        <div class="card-grid">
          <span>学号<strong>${escapeHtml(error.studentNo || "未填写")}</strong></span>
          <span>姓名<strong>${escapeHtml(error.name || "未填写")}</strong></span>
          <span>当前值<strong>${escapeHtml(error.value || "空")}</strong></span>
          <span class="wide-card">错误说明<strong>${escapeHtml(error.message || "-")}</strong></span>
        </div>
      </article>
    `).join("");
    return;
  }

  elements.cards.innerHTML = rows.map((student) => `
    <article class="student-card">
      <div class="card-top">
        <div>
          <span class="student-name">${escapeHtml(student.name)}</span>
          <span class="student-sub">${escapeHtml(student.studentNo)} · ${escapeHtml(student.className)}</span>
        </div>
      </div>
      <div class="card-grid">
        <span>性别<strong>${escapeHtml(student.gender)}</strong></span>
        <span>年龄<strong>${escapeHtml(student.age || "未填")}</strong></span>
        <span>身份证号<strong>${escapeHtml(maskIdCard(student.idCard) || "未填写")}</strong></span>
        <span>银行卡号<strong>${escapeHtml(maskBankCard(student.bankCard) || "未填写")}</strong></span>
        <span>开户银行<strong>${escapeHtml(student.bankName || "未填写")}</strong></span>
        <span>资助项目<strong>${escapeHtml(student.aidProject || "未填写")}</strong></span>
        <span>资助金额<strong>${escapeHtml(formatAmount(student.aidAmount) || "未填写")}</strong></span>
        <span>电话<strong>${escapeHtml(student.phone)}</strong></span>
        <span>住址<strong>${escapeHtml(student.address || "未填写")}</strong></span>
        <span class="wide-card">备注<strong>${escapeHtml(student.remark || "无")}</strong></span>
      </div>
      <div class="card-actions">${actionButtons(student.id)}</div>
    </article>
  `).join("");
  bindActionButtons(elements.cards);
}

function actionButtons(id) {
  return `
    <div class="row-actions">
      <button class="btn small-btn edit" type="button" data-action="edit" data-id="${id}">编辑</button>
      <button class="btn small-btn danger" type="button" data-action="delete" data-id="${id}">删除</button>
    </div>
  `;
}

function bindActionButtons(root) {
  root.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleAction);
  });
}

function handleAction(event) {
  const { action, id } = event.currentTarget.dataset;
  if (action === "edit") editStudent(id);
  if (action === "delete") openDeleteModal(id);
  if (action === "locate") locateStudent(id);
  if (action === "process") processResult(id);
}

function editStudent(id) {
  if (activeView === "result") return;
  const list = getActiveRows();
  const student = list.find((item) => item.id === id);
  if (!student) return;

  editingDataset = activeView;
  elements.studentId.value = student.id;
  elements.formTitle.textContent = "编辑学生信息";
  elements.editingNotice.textContent = `当前正在编辑：${student.name}（${activeView === "standard" ? "标准学生库" : "待核对表"}）`;
  elements.editingNotice.classList.remove("hidden");
  elements.submitBtn.textContent = "保存修改";
  elements.cancelEditBtn.classList.remove("hidden");
  clearAllErrors();
  ["name", "studentNo", "gender", "age", "className", "phone", "idCard", "bankCard", "bankName", "aidProject", "aidAmount", "address", "remark"].forEach((field) => {
    elements.form.elements[field].value = student[field] || "";
  });
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openDeleteModal(id) {
  if (activeView === "result") return;
  const list = getActiveRows();
  const student = list.find((item) => item.id === id);
  if (!student) return;

  pendingDelete = { id, dataset: activeView };
  elements.confirmMessage.textContent = `确定删除「${student.name}」的学生信息吗？此操作不可恢复。`;
  elements.confirmModal.classList.remove("hidden");
  elements.confirmDeleteBtn.focus();
}

function closeDeleteModal() {
  pendingDelete = null;
  elements.confirmModal.classList.add("hidden");
}

function confirmDeleteStudent() {
  if (!pendingDelete) return;
  const deleted = getDataset(pendingDelete.dataset).find((item) => item.id === pendingDelete.id);
  if (pendingDelete.dataset === "standard") {
    standardStudents = standardStudents.filter((item) => item.id !== pendingDelete.id);
  } else {
    checkStudents = checkStudents.filter((item) => item.id !== pendingDelete.id);
  }
  verificationResults = [];
  saveAll();
  closeDeleteModal();
  render();
  recordAudit("删除学生信息", deleted ? `${deleted.name}（${deleted.studentNo}）` : "删除记录");
  showToast("删除成功");
}

function locateStudent(studentNo) {
  if (!studentNo) return;
  const inCheck = checkStudents.some((item) => item.studentNo === studentNo);
  activeView = inCheck ? "check" : "standard";
  elements.searchInput.value = studentNo;
  syncTabs();
  render();
}

function processResult(id) {
  const result = verificationResults.find((item) => item.id === id);
  if (!result) return;
  const note = window.prompt("请输入处理意见或复核说明：", result.processedNote || "");
  if (note === null) return;
  result.processed = true;
  result.processedNote = clean(note) || "已人工复核";
  result.processedAt = new Date().toISOString();
  result.processedBy = LOGIN_ACCOUNT.username;
  saveAll();
  render();
  recordAudit("处理核对异常", `${result.name || result.studentNo}：${result.processedNote}`);
  showToast("处理状态已保存");
}

function renderStats() {
  const passCount = verificationResults.filter((item) => item.status === "通过").length;
  const issueCount = verificationResults.filter((item) => item.status && item.status !== "通过").length;
  const duplicateCount = countDuplicateValues(standardStudents) + countDuplicateValues(checkStudents);
  elements.totalCount.textContent = standardStudents.length;
  elements.passCount.textContent = passCount;
  elements.issueCount.textContent = issueCount;
  elements.duplicateCount.textContent = duplicateCount;
}

function countDuplicateValues(list) {
  let duplicates = 0;
  countStudentNos(list).forEach((count) => {
    if (count > 1) duplicates += count;
  });
  return duplicates;
}

function updateClassFilter() {
  const currentValue = elements.classFilter.value;
  const rows = getActiveRows();
  const classNames = [...new Set(rows.map((row) => row.className).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  elements.classFilter.innerHTML = '<option value="">全部班级</option>' + classNames
    .map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`)
    .join("");
  elements.classFilter.value = classNames.includes(currentValue) ? currentValue : "";
}

function renderEmptyState(rows) {
  if (rows.length > 0) {
    elements.emptyState.classList.add("hidden");
    return;
  }

  const hasFilter = elements.searchInput.value.trim() || elements.classFilter.value;
  if (hasFilter) {
    elements.emptyTitle.textContent = "未找到符合条件的数据，请调整搜索或筛选条件";
    elements.emptyText.textContent = "可以清空搜索关键词，或切换到全部班级查看完整数据。";
  } else if (activeView === "standard") {
    elements.emptyTitle.textContent = "暂无标准学生库，请先添加或导入学生信息";
    elements.emptyText.textContent = "手动新增的数据默认进入标准学生库，也可以导入 Excel 批量建立数据库。";
  } else if (activeView === "check") {
    elements.emptyTitle.textContent = "暂无待核对表，请先导入 Excel";
    elements.emptyText.textContent = "导入待核对表后，点击开始比对即可自动生成核验结果。";
  } else if (activeView === "importErrors") {
    elements.emptyTitle.textContent = "暂无导入错误";
    elements.emptyText.textContent = "导入 Excel 后，如果存在字段缺失或格式异常，会在这里显示具体行号和错误原因。";
  } else {
    elements.emptyTitle.textContent = "暂无核对结果，请先开始比对";
    elements.emptyText.textContent = "系统会按学号比对标准库与待核对表，并展示异常字段和详情。";
  }
  elements.emptyState.classList.remove("hidden");
}

function exportResults() {
  if (verificationResults.length === 0) {
    showToast("暂无核对结果可导出");
    return;
  }

  const exportFull = window.confirm("是否导出完整身份证号和银行卡号？\n\n确定：完整导出，用于校内正式复核。\n取消：脱敏导出，更适合分享或演示。");
  const rows = verificationResults.map((item) => ({
    学号: item.studentNo,
    姓名: item.name,
    班级: item.className,
    联系方式: item.phone,
    身份证号: exportFull ? item.idCard : maskIdCard(item.idCard, true),
    银行卡号: exportFull ? item.bankCard : maskBankCard(item.bankCard, true),
    开户银行: item.bankName,
    资助项目: item.aidProject,
    资助金额: item.aidAmount,
    核对状态: item.status,
    处理状态: item.processed ? "已处理" : "未处理",
    处理人: item.processedBy,
    处理时间: item.processedAt,
    处理备注: item.processedNote,
    异常字段: item.fields,
    详情: item.detail
  }));

  if (window.XLSX) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "核对结果");
    XLSX.writeFile(workbook, `学生信息核对结果-${today()}.xlsx`);
  } else {
    exportCsv(rows);
  }
  recordAudit(exportFull ? "完整导出核对结果" : "脱敏导出核对结果", `导出 ${rows.length} 条`);
  showToast("核对结果已导出");
}

function exportCsv(rows) {
  downloadRowsCsv(rows, `学生信息核对结果-${today()}.csv`);
}

function downloadRowsCsv(rows, filename) {
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] || "").replaceAll('"', '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadTemplate(type) {
  const sampleRows = [
    {
      姓名: "测试学生",
      学号: type === "standard" ? "2026999" : "2026999",
      性别: "男",
      班级: "旅游管理一班",
      联系方式: "13800009999",
      身份证号: "370602200801010010",
      银行卡号: "6222020200010000001",
      年龄: "18",
      家庭住址: "山东省烟台市",
      开户银行: "中国工商银行烟台分行",
      资助项目: "国家助学金",
      资助金额: "3300",
      备注: type === "standard" ? "标准学生库模板示例" : "待核对表模板示例"
    }
  ];

  const fileName = `${type === "standard" ? "标准学生库" : "待核对表"}导入模板-${today()}`;
  if (window.XLSX) {
    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: TEMPLATE_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type === "standard" ? "标准学生库" : "待核对表");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    downloadRowsCsv(sampleRows, `${fileName}.csv`);
  }
  recordAudit("下载导入模板", fileName);
  showToast("模板已生成");
}

function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    standardStudents,
    checkStudents,
    verificationResults,
    importErrors,
    settings,
    auditLog
  };
  downloadJson(payload, `学生核验系统本地备份-${today()}.json`);
  recordAudit("导出本地备份", "导出标准库、待核对表、核对结果和设置");
  showToast("本地备份已导出");
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const payload = JSON.parse(loadEvent.target.result);
      if (!payload || !Array.isArray(payload.standardStudents) || !Array.isArray(payload.checkStudents)) {
        throw new Error("备份文件格式不正确");
      }
      const confirmed = window.confirm("导入备份会覆盖当前本地数据，是否继续？");
      if (!confirmed) return;
      standardStudents = payload.standardStudents.map(normalizeStudent);
      checkStudents = payload.checkStudents.map(normalizeStudent);
      verificationResults = Array.isArray(payload.verificationResults) ? payload.verificationResults.map(normalizeResult) : [];
      importErrors = Array.isArray(payload.importErrors) ? payload.importErrors : [];
      settings = payload.settings ? { ...loadSettings(), ...payload.settings } : loadSettings();
      auditLog = Array.isArray(payload.auditLog) ? payload.auditLog : [];
      activeView = "standard";
      saveAll();
      renderRulePanel();
      syncTabs();
      render();
      recordAudit("导入本地备份", file.name);
      showToast("备份导入完成");
    } catch (error) {
      showToast(`备份导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetAllData() {
  const firstConfirmed = window.confirm("确定重置所有数据吗？标准库、待核对表和核对结果都会被覆盖。");
  if (!firstConfirmed) return;
  const secondConfirmed = window.confirm("请再次确认：重置后当前本地核验数据将恢复为示例状态。");
  if (!secondConfirmed) return;

  standardStudents = sampleStandardStudents.map((student) => ({ ...student, id: crypto.randomUUID() }));
  checkStudents = [];
  verificationResults = [];
  importErrors = [];
  activeView = "standard";
  saveAll();
  resetForm();
  syncTabs();
  render();
  recordAudit("重置本地数据", "恢复示例标准学生库并清空待核对表");
  showToast("重置成功");
}

function resetForm() {
  elements.form.reset();
  elements.studentId.value = "";
  editingDataset = "standard";
  elements.formTitle.textContent = "学生信息登记";
  elements.editingNotice.textContent = "";
  elements.editingNotice.classList.add("hidden");
  elements.submitBtn.textContent = "添加到学生库";
  elements.cancelEditBtn.classList.add("hidden");
  clearAllErrors();
}

function getDataset(type) {
  return type === "standard" ? standardStudents : checkStudents;
}

function normalizeStudent(student) {
  return {
    id: student.id || crypto.randomUUID(),
    name: clean(student.name),
    studentNo: normalizeNo(student.studentNo),
    gender: clean(student.gender),
    age: normalizeAge(student.age),
    className: clean(student.className),
    phone: normalizePhone(student.phone),
    idCard: normalizeIdCard(student.idCard),
    bankCard: normalizeBankCard(student.bankCard),
    bankName: clean(student.bankName),
    aidProject: clean(student.aidProject),
    aidAmount: normalizeAmount(student.aidAmount),
    address: clean(student.address),
    remark: clean(student.remark),
    createdAt: Number(student.createdAt) || Date.now()
  };
}

function normalizeResult(result) {
  return {
    id: result.id || crypto.randomUUID(),
    studentNo: clean(result.studentNo),
    name: clean(result.name),
    className: clean(result.className),
    phone: normalizePhone(result.phone),
    idCard: normalizeIdCard(result.idCard),
    bankCard: normalizeBankCard(result.bankCard),
    bankName: clean(result.bankName),
    aidProject: clean(result.aidProject),
    aidAmount: normalizeAmount(result.aidAmount),
    status: clean(result.status),
    fields: clean(result.fields),
    detail: clean(result.detail),
    processed: result.processed === true,
    processedBy: clean(result.processedBy),
    processedAt: clean(result.processedAt),
    processedNote: clean(result.processedNote),
    createdAt: Number(result.createdAt) || Date.now()
  };
}

function normalizeNo(value) {
  return clean(value);
}

function normalizePhone(value) {
  return clean(value).replace(/\s+/g, "");
}

function normalizeIdCard(value) {
  return clean(value).replace(/\s+/g, "").toUpperCase();
}

function normalizeBankCard(value) {
  return clean(value).replace(/[\s-]+/g, "");
}

function normalizeAge(value) {
  const text = clean(value);
  if (!text) return "";
  const number = Number(text);
  return Number.isFinite(number) ? String(number) : text;
}

function normalizeAmount(value) {
  const text = clean(value).replace(/,/g, "");
  if (!text) return "";
  const number = Number(text);
  return Number.isFinite(number) ? String(number) : text;
}

function pickStudentFields(student) {
  return {
    name: student.name,
    studentNo: student.studentNo,
    gender: student.gender,
    age: student.age,
    className: student.className,
    phone: student.phone,
    idCard: student.idCard,
    bankCard: student.bankCard,
    bankName: student.bankName,
    aidProject: student.aidProject,
    aidAmount: student.aidAmount,
    address: student.address,
    remark: student.remark
  };
}

function isValidAge(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 6 && number <= 80;
}

function isValidAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function isValidIdCard(value) {
  const text = normalizeIdCard(value);
  if (/^\d{15}$/.test(text)) return true;
  if (!/^\d{17}[\dX]$/.test(text)) return false;

  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = factors.reduce((total, factor, index) => total + Number(text[index]) * factor, 0);
  return checks[sum % 11] === text[17];
}

function clean(value) {
  return String(value ?? "").trim();
}

function displayValue(value) {
  return clean(value) || "空";
}

function displayFieldValue(field, value) {
  if (field === "idCard") return displayValue(maskIdCard(value));
  if (field === "bankCard") return displayValue(maskBankCard(value));
  if (field === "aidAmount") return displayValue(formatAmount(value));
  return displayValue(value);
}

function maskIdCard(value, force = false) {
  const text = clean(value);
  if (!force && !settings.maskSensitive) return text;
  if (text.length < 10) return text;
  return `${text.slice(0, 6)}********${text.slice(-4)}`;
}

function maskBankCard(value, force = false) {
  const text = clean(value);
  if (!force && !settings.maskSensitive) return text;
  if (text.length < 8) return text;
  return `${text.slice(0, 4)} **** **** ${text.slice(-4)}`;
}

function formatAmount(value) {
  const text = clean(value);
  if (!text || !isValidAmount(text)) return text;
  return Number(text).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function renderRulePanel() {
  elements.privacyToggle.checked = settings.maskSensitive;
  elements.rulePanel.innerHTML = `
    <span class="rule-title">参与自动比对的字段</span>
    ${CORE_FIELDS.map(([field, label]) => `
      <label class="inline-check">
        <input type="checkbox" name="compareField" value="${field}" ${settings.compareFields.includes(field) ? "checked" : ""}>
        <span>${label}</span>
      </label>
    `).join("")}
  `;
}

function updatePrivacySetting(event) {
  settings.maskSensitive = event.target.checked;
  saveAll();
  render();
  recordAudit("切换脱敏显示", settings.maskSensitive ? "开启脱敏显示" : "关闭脱敏显示");
}

function updateCompareFields(event) {
  if (event.target.name !== "compareField") return;
  const selected = [...elements.rulePanel.querySelectorAll('input[name="compareField"]:checked')]
    .map((input) => input.value);
  if (selected.length === 0) {
    event.target.checked = true;
    showToast("至少保留一个参与比对的字段");
    return;
  }
  settings.compareFields = selected;
  verificationResults = [];
  saveAll();
  render();
  recordAudit("调整核验规则", `当前比对字段：${selected.map(getFieldLabel).join("、")}`);
  showToast("核验字段已更新，请重新开始比对");
}

function getFieldLabel(field) {
  return CORE_FIELDS.find(([key]) => key === field)?.[1] || field;
}

function getFieldValueByLabel(student, label) {
  const field = CORE_FIELDS.find(([, fieldLabel]) => fieldLabel === label)?.[0];
  if (field) return displayFieldValue(field, student[field]);
  if (label === "学号") return student.studentNo;
  if (label === "姓名") return student.name;
  if (label === "联系方式") return student.phone;
  return "";
}

function renderProcessState(result) {
  if (!result.processed) return '<span class="status-pill status-absent">未处理</span>';
  const title = [result.processedBy, result.processedAt, result.processedNote].filter(Boolean).join(" · ");
  return `<span class="status-pill status-pass" title="${escapeHtml(title)}">已处理</span>`;
}

function recordAudit(action, detail = "") {
  auditLog.push({
    id: crypto.randomUUID(),
    action,
    detail,
    time: new Date().toISOString(),
    operator: LOGIN_ACCOUNT.username
  });
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(auditLog.slice(-300)));
}

function statusClass(status) {
  const map = {
    通过: "status-pass",
    信息不一致: "status-mismatch",
    未录入学生: "status-missing",
    待核对表缺失: "status-absent",
    重复学号: "status-duplicate",
    格式异常: "status-format",
    无效数据: "status-invalid"
  };
  return map[status] || "status-invalid";
}

function showErrors(errors) {
  clearAllErrors();
  Object.entries(errors).forEach(([field, message]) => {
    const input = elements.form.elements[field];
    const errorNode = elements.form.querySelector(`[data-error-for="${field}"]`);
    input?.classList.add("invalid");
    if (errorNode) errorNode.textContent = message;
  });
}

function clearFieldError(event) {
  const field = event.target.name;
  if (!field) return;
  event.target.classList.remove("invalid");
  const errorNode = elements.form.querySelector(`[data-error-for="${field}"]`);
  if (errorNode) errorNode.textContent = "";
}

function clearAllErrors() {
  elements.form.querySelectorAll(".invalid").forEach((node) => node.classList.remove("invalid"));
  elements.form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function updateSearchClear() {
  elements.clearSearchBtn.classList.toggle("hidden", elements.searchInput.value.trim() === "");
}

function clearSearch() {
  elements.searchInput.value = "";
  updateSearchClear();
  render();
  elements.searchInput.focus();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
