const STORAGE_KEYS = {
  standard: "ytct-verification:standardStudents:v1",
  check: "ytct-verification:checkStudents:v1",
  result: "ytct-verification:verificationResults:v1"
};

const AUTH_KEY = "ytct-verification:auth";
const LOGIN_ACCOUNT = {
  username: "admin",
  password: "YTCT@2026"
};

const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const REQUIRED_HEADERS = ["姓名", "学号", "性别", "班级", "联系方式"];
const OPTIONAL_HEADERS = ["年龄", "家庭住址", "备注"];
const CORE_FIELDS = [
  ["name", "姓名"],
  ["gender", "性别"],
  ["age", "年龄"],
  ["className", "班级"],
  ["phone", "联系方式"],
  ["address", "家庭住址"]
];

const sampleStandardStudents = [
  {
    id: crypto.randomUUID(),
    name: "李明",
    studentNo: "2026001",
    gender: "男",
    age: "18",
    className: "旅游管理一班",
    phone: "13800000001",
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
    address: "山东省烟台市福山区",
    remark: "",
    createdAt: Date.now() - 100000
  }
];

let standardStudents = loadList(STORAGE_KEYS.standard, sampleStandardStudents);
let checkStudents = loadList(STORAGE_KEYS.check, []);
let verificationResults = loadResults();
let activeView = "standard";
let editingDataset = "standard";
let pendingDelete = null;

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
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
  compareBtn: document.querySelector("#compareBtn"),
  exportResultBtn: document.querySelector("#exportResultBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  confirmModal: document.querySelector("#confirmModal"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmDeleteBtn: document.querySelector("#confirmDeleteBtn"),
  cancelDeleteBtn: document.querySelector("#cancelDeleteBtn"),
  toast: document.querySelector("#toast")
};

elements.loginForm.addEventListener("submit", handleLogin);
elements.logoutBtn.addEventListener("click", logout);
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
elements.compareBtn.addEventListener("click", runVerification);
elements.exportResultBtn.addEventListener("click", exportResults);
elements.resetBtn.addEventListener("click", resetAllData);
elements.confirmDeleteBtn.addEventListener("click", confirmDeleteStudent);
elements.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
elements.confirmModal.addEventListener("click", (event) => {
  if (event.target === elements.confirmModal) closeDeleteModal();
});
document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

initAuth();
render();

function initAuth() {
  const authed = sessionStorage.getItem(AUTH_KEY) === "true";
  elements.loginScreen.classList.toggle("hidden", authed);
  elements.appShell.classList.toggle("hidden", !authed);
  if (!authed) {
    elements.loginUsername.focus();
  }
}

function handleLogin(event) {
  event.preventDefault();
  const username = clean(elements.loginUsername.value);
  const password = elements.loginPassword.value;
  const valid = username === LOGIN_ACCOUNT.username && password === LOGIN_ACCOUNT.password;

  if (!valid) {
    elements.loginError.classList.remove("hidden");
    elements.loginPassword.value = "";
    elements.loginPassword.focus();
    return;
  }

  sessionStorage.setItem(AUTH_KEY, "true");
  elements.loginError.classList.add("hidden");
  elements.loginForm.reset();
  initAuth();
  showToast("登录成功，欢迎进入系统");
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  resetForm();
  initAuth();
  showToast("已退出登录");
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.standard, JSON.stringify(standardStudents));
  localStorage.setItem(STORAGE_KEYS.check, JSON.stringify(checkStudents));
  localStorage.setItem(STORAGE_KEYS.result, JSON.stringify(verificationResults));
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
  saveAll();
  resetForm();
  activeView = target;
  syncTabs();
  render();
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

      if (type === "standard") {
        standardStudents = imported;
        activeView = "standard";
        showToast(`导入成功，标准学生库共 ${imported.length} 条`);
      } else {
        checkStudents = imported;
        activeView = "check";
        showToast(`导入成功，待核对表共 ${imported.length} 条`);
      }

      verificationResults = [];
      saveAll();
      resetForm();
      syncTabs();
      render();
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
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
    .map((row) => {
      const normalizedRow = {};
      validHeaders.forEach((header) => {
        normalizedRow[header] = clean(row[header]);
      });
      return normalizeStudent({
        id: crypto.randomUUID(),
        name: normalizedRow["姓名"],
        studentNo: normalizedRow["学号"],
        gender: normalizedRow["性别"],
        age: normalizedRow["年龄"],
        className: normalizedRow["班级"],
        phone: normalizedRow["联系方式"],
        address: normalizedRow["家庭住址"],
        remark: normalizedRow["备注"],
        createdAt: Date.now()
      });
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
      .filter(([field]) => clean(standard[field]) !== clean(student[field]))
      .map(([field, label]) => `${label}不一致：标准库为 ${displayValue(standard[field])}，待核对表为 ${displayValue(student[field])}`);

    if (diffs.length > 0) {
      results.push(makeResult(base, "信息不一致", getDiffFieldLabels(diffs), diffs.join("；")));
      return;
    }

    results.push(makeResult(base, "通过", "", "所有核心字段一致"));
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

  return results.map((item, index) => ({ ...item, id: `${Date.now()}-${index}` }));
}

function getFormatErrors(student) {
  const errors = [];
  if (student.gender && !["男", "女"].includes(student.gender)) {
    errors.push({ field: "性别", message: `性别格式异常：${student.gender}` });
  }
  if (student.age && !isValidAge(student.age)) {
    errors.push({ field: "年龄", message: `年龄格式异常：${student.age}` });
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
    phone: student?.phone || ""
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
  elements.dataTable.className = activeView === "result" ? "result-table" : "student-data-table";
  if (activeView === "result") {
    elements.tableHead.innerHTML = `
      <tr>
        <th>学号</th>
        <th>姓名</th>
        <th>班级</th>
        <th>联系方式</th>
        <th>核对状态</th>
        <th>异常字段</th>
        <th>详情</th>
        <th>操作</th>
      </tr>
    `;
    elements.table.innerHTML = rows.map(renderResultRow).join("");
  } else {
    elements.tableHead.innerHTML = `
      <tr>
        <th>姓名</th>
        <th>学号</th>
        <th>性别</th>
        <th>年龄</th>
        <th>班级</th>
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
      <td>${escapeHtml(result.phone || "未填写")}</td>
      <td><span class="status-pill ${statusClass(result.status)}">${escapeHtml(result.status)}</span></td>
      <td>${escapeHtml(result.fields || "-")}</td>
      <td title="${escapeHtml(result.detail)}">${escapeHtml(result.detail)}</td>
      <td><button class="btn small-btn" type="button" data-action="locate" data-id="${escapeHtml(result.studentNo)}">定位</button></td>
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
          <span>异常字段<strong>${escapeHtml(result.fields || "-")}</strong></span>
          <span class="wide-card">详情<strong>${escapeHtml(result.detail)}</strong></span>
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
  ["name", "studentNo", "gender", "age", "className", "phone", "address", "remark"].forEach((field) => {
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
  if (pendingDelete.dataset === "standard") {
    standardStudents = standardStudents.filter((item) => item.id !== pendingDelete.id);
  } else {
    checkStudents = checkStudents.filter((item) => item.id !== pendingDelete.id);
  }
  verificationResults = [];
  saveAll();
  closeDeleteModal();
  render();
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

  const rows = verificationResults.map((item) => ({
    学号: item.studentNo,
    姓名: item.name,
    班级: item.className,
    联系方式: item.phone,
    核对状态: item.status,
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
  showToast("核对结果已导出");
}

function exportCsv(rows) {
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] || "").replaceAll('"', '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `学生信息核对结果-${today()}.csv`;
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
  activeView = "standard";
  saveAll();
  resetForm();
  syncTabs();
  render();
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
    address: clean(student.address),
    remark: clean(student.remark),
    createdAt: Number(student.createdAt) || Date.now()
  };
}

function normalizeNo(value) {
  return clean(value);
}

function normalizePhone(value) {
  return clean(value).replace(/\s+/g, "");
}

function normalizeAge(value) {
  const text = clean(value);
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
    address: student.address,
    remark: student.remark
  };
}

function isValidAge(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 6 && number <= 80;
}

function clean(value) {
  return String(value ?? "").trim();
}

function displayValue(value) {
  return clean(value) || "空";
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
