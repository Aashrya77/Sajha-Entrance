import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  H2,
  H4,
  Label,
  RichTextEditor,
  Text,
} from "@adminjs/design-system";
import renderMathInElement from "katex/dist/contrib/auto-render.js";

const ADMIN_KATEX_STYLESHEET_ID = "sajha-admin-katex-css";
const ADMIN_KATEX_STYLESHEET_HREF = "/admin/vendor/katex/katex.min.css";

const surfaceStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  boxShadow: "0 12px 35px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  background: "#fff",
  fontSize: "14px",
};

const fileInputStyle = {
  width: "100%",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px dashed #cbd5e1",
  padding: "10px 12px",
  background: "#f8fafc",
};

const badgeStyle = (tone = "neutral") => {
  const tones = {
    success: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    warning: {
      background: "#ffedd5",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    brand: {
      background: "#fff1e8",
      color: "#d95a12",
      border: "1px solid #ffd7bf",
    },
    neutral: {
      background: "#f8fafc",
      color: "#475569",
      border: "1px solid #e2e8f0",
    },
    active: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
  };

  return {
    ...tones[tone],
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  };
};

const emptyOptionState = () => ({
  text: "",
  image: "",
  imageFile: null,
  imageRemoved: false,
});

const getEmptyQuestionForm = () => ({
  _id: "",
  questionText: "",
  questionImage: "",
  questionImageFile: null,
  questionImageRemoved: false,
  options: Array.from({ length: 4 }, emptyOptionState),
  correctOption: -1,
  marks: 1,
  explanation: "",
  difficulty: "",
  status: "published",
  displayOrder: 0,
});

const getEmptyMockTestForm = () => ({
  _id: "",
  title: "",
  description: "",
  instructions: "",
  courseRef: "",
  subjectRefs: [],
  questionRefs: [],
  status: "draft",
  startAt: "",
  endAt: "",
  duration: 60,
  passMarks: 0,
});

const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not scheduled";

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const toIdString = (value = "") => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value?._id) {
    return toIdString(value._id);
  }

  return String(value);
};

const readFilePreview = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ImagePreview = ({ src, alt, onRemove }) =>
  src ? (
    <Box
      style={{
        marginTop: "12px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: "12px",
        display: "grid",
        gap: "10px",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          maxHeight: "180px",
          objectFit: "contain",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
        }}
      />
      <Button size="sm" variant="text" color="danger" onClick={onRemove}>
        Remove image
      </Button>
    </Box>
  ) : null;

const RenderedHtml = ({ html, emptyLabel }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    try {
      renderMathInElement(contentRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    } catch (_error) {
      // Keep preview readable even if some formulas are malformed.
    }
  }, [html]);

  if (!html) {
    return (
      <Text style={{ color: "#94a3b8", fontStyle: "italic" }}>{emptyLabel}</Text>
    );
  }

  return (
    <div
      ref={contentRef}
      style={{ color: "#0f172a", lineHeight: 1.75, fontSize: "15px" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default function MockTestWorkspace() {
  const [workspace, setWorkspace] = useState({
    courses: [],
    subjects: [],
    tests: [],
    selectedTestId: null,
  });
  const [subjectWorkspaces, setSubjectWorkspaces] = useState({});
  const [form, setForm] = useState(getEmptyMockTestForm());
  const [questionForm, setQuestionForm] = useState(getEmptyQuestionForm());
  const [questionFormVersion, setQuestionFormVersion] = useState(0);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMockTest, setSavingMockTest] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [publishingSubject, setPublishingSubject] = useState(false);
  const [subjectLoadingIds, setSubjectLoadingIds] = useState([]);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionStatusFilter, setQuestionStatusFilter] = useState("all");
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState("all");
  const [testSearch, setTestSearch] = useState("");

  const isSubjectLoading = subjectLoadingIds.includes(activeSubjectId);

  const syncWorkspaceSubject = (subjectRecord) => {
    if (!subjectRecord?._id) {
      return;
    }

    const normalizedSubjectId = `${subjectRecord._id}`;

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      subjects: (currentWorkspace.subjects || []).map((subject) =>
        `${subject._id}` === normalizedSubjectId
          ? {
              ...subject,
              ...subjectRecord,
            }
          : subject
      ),
    }));
  };

  const applySubjectWorkspace = (subjectId, nextWorkspace) => {
    if (!subjectId || !nextWorkspace?.subject) {
      return;
    }

    setSubjectWorkspaces((current) => ({
      ...current,
      [subjectId]: nextWorkspace,
    }));
    syncWorkspaceSubject(nextWorkspace.subject);
  };

  const hydrateMockTestForm = (test) => {
    if (!test?._id) {
      return;
    }

    const nextSubjectRefs = Array.isArray(test.subjectRefs)
      ? test.subjectRefs.map((entry) => toIdString(entry))
      : [];
    const nextQuestionRefs = Array.isArray(test.questionRefs)
      ? test.questionRefs.map((entry) => toIdString(entry))
      : [];

    setSelectedTestId(`${test._id}`);
    setForm({
      _id: `${test._id}`,
      title: test.title || "",
      description: test.description || "",
      instructions: test.instructions || "",
      courseRef: toIdString(test.courseRef),
      subjectRefs: nextSubjectRefs,
      questionRefs: nextQuestionRefs,
      status: test.status || "draft",
      startAt: formatDateTimeInput(test.startAt),
      endAt: formatDateTimeInput(test.endAt),
      duration: Number(test.duration || 60) || 60,
      passMarks: Number(test.passMarks || 0) || 0,
    });
    setActiveQuestionId("");
    setQuestionForm(getEmptyQuestionForm());
    setActiveSubjectId((currentActiveSubjectId) =>
      currentActiveSubjectId && nextSubjectRefs.includes(currentActiveSubjectId)
        ? currentActiveSubjectId
        : nextSubjectRefs[0] || ""
    );
  };

  const applyWorkspaceResponse = (nextWorkspace, message = "") => {
    if (!nextWorkspace) {
      return;
    }

    setWorkspace(nextWorkspace);

    if (message) {
      setPageMessage(message);
    }

    const nextSelectedTestId = toIdString(nextWorkspace.selectedTestId);
    if (nextSelectedTestId) {
      const selectedTest = (nextWorkspace.tests || []).find(
        (test) => `${test._id}` === nextSelectedTestId
      );

      if (selectedTest) {
        hydrateMockTestForm(selectedTest);
      }
    }
  };

  const loadWorkspace = async () => {
    setLoading(true);

    try {
      const response = await fetch("/admin/api/mock-tests/workspace", {
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load the mock test workspace.");
      }

      setWorkspace(data.data || { courses: [], subjects: [], tests: [] });
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const ensureSubjectWorkspace = async (subjectId) => {
    const normalizedSubjectId = `${subjectId || ""}`;

    if (!normalizedSubjectId || subjectWorkspaces[normalizedSubjectId]) {
      return;
    }

    setSubjectLoadingIds((current) =>
      current.includes(normalizedSubjectId)
        ? current
        : [...current, normalizedSubjectId]
    );

    try {
      const response = await fetch(
        `/admin/api/mock-tests/subjects/${normalizedSubjectId}/workspace`,
        {
          credentials: "same-origin",
        }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load the subject workspace.");
      }

      applySubjectWorkspace(normalizedSubjectId, data.data);
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSubjectLoadingIds((current) =>
        current.filter((entry) => entry !== normalizedSubjectId)
      );
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    let stylesheet = document.getElementById(ADMIN_KATEX_STYLESHEET_ID);
    let createdStylesheet = false;

    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.id = ADMIN_KATEX_STYLESHEET_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = ADMIN_KATEX_STYLESHEET_HREF;
      document.head.appendChild(stylesheet);
      createdStylesheet = true;
    }

    return () => {
      if (createdStylesheet && stylesheet?.parentNode) {
        stylesheet.parentNode.removeChild(stylesheet);
      }
    };
  }, []);

  useEffect(() => {
    if (!form.courseRef) {
      setActiveSubjectId("");
      return;
    }

    if (!activeSubjectId && form.subjectRefs.length) {
      setActiveSubjectId(form.subjectRefs[0]);
    }
  }, [activeSubjectId, form.courseRef, form.subjectRefs]);

  useEffect(() => {
    form.subjectRefs.forEach((subjectId) => {
      if (!subjectWorkspaces[subjectId]) {
        ensureSubjectWorkspace(subjectId);
      }
    });
  }, [form.subjectRefs, subjectWorkspaces]);

  useEffect(() => {
    if (activeSubjectId && !subjectWorkspaces[activeSubjectId]) {
      ensureSubjectWorkspace(activeSubjectId);
    }
  }, [activeSubjectId, subjectWorkspaces]);

  useEffect(() => {
    setQuestionSearch("");
    setQuestionStatusFilter("all");
    setQuestionDifficultyFilter("all");
    setActiveQuestionId("");
    setQuestionForm(getEmptyQuestionForm());
    setQuestionFormVersion((currentVersion) => currentVersion + 1);
  }, [activeSubjectId]);

  const courseSubjects = useMemo(
    () =>
      (workspace.subjects || []).filter(
        (subject) => toIdString(subject.course) === form.courseRef
      ),
    [form.courseRef, workspace.subjects]
  );

  const activeSubjectWorkspace = activeSubjectId
    ? subjectWorkspaces[activeSubjectId] || null
    : null;

  const activeSubjectQuestions = useMemo(() => {
    const questions = Array.isArray(activeSubjectWorkspace?.questions)
      ? activeSubjectWorkspace.questions
      : [];

    const normalizedSearch = questionSearch.trim().toLowerCase();

    return questions.filter((question) => {
      if (
        questionStatusFilter !== "all" &&
        String(question.status || "").toLowerCase() !== questionStatusFilter
      ) {
        return false;
      }

      if (
        questionDifficultyFilter !== "all" &&
        String(question.difficulty || "").toLowerCase() !== questionDifficultyFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        question.questionSummary,
        question.questionText,
        question.explanation,
        ...(question.optionSummaries || []),
      ]
        .map((value) => stripHtml(value).toLowerCase())
        .join(" ");

      return haystack.includes(normalizedSearch);
    });
  }, [
    activeSubjectWorkspace,
    questionDifficultyFilter,
    questionSearch,
    questionStatusFilter,
  ]);

  const selectedQuestionSet = useMemo(
    () => new Set(form.questionRefs.map((entry) => `${entry}`)),
    [form.questionRefs]
  );

  const selectedQuestionLookup = useMemo(() => {
    const lookup = new Map();

    Object.values(subjectWorkspaces).forEach((subjectWorkspace) => {
      const subjectName = subjectWorkspace?.subject?.name || "";
      const subjectId = toIdString(subjectWorkspace?.subject?._id);

      (subjectWorkspace?.questions || []).forEach((question) => {
        lookup.set(`${question._id}`, {
          ...question,
          subjectName,
          subjectId,
        });
      });
    });

    return lookup;
  }, [subjectWorkspaces]);

  const selectedQuestionSummary = useMemo(() => {
    const questions = form.questionRefs
      .map((questionId) => selectedQuestionLookup.get(`${questionId}`))
      .filter(Boolean);

    return {
      count: form.questionRefs.length,
      loadedCount: questions.length,
      totalMarks: questions.reduce(
        (sum, question) => sum + (Number(question.marks) || 0),
        0
      ),
      questions,
    };
  }, [form.questionRefs, selectedQuestionLookup]);

  const selectedQuestionCountBySubject = useMemo(() => {
    const counts = {};

    selectedQuestionSummary.questions.forEach((question) => {
      counts[question.subjectId] = (counts[question.subjectId] || 0) + 1;
    });

    return counts;
  }, [selectedQuestionSummary.questions]);

  const filteredTests = useMemo(() => {
    const term = testSearch.trim().toLowerCase();

    if (!term) {
      return workspace.tests || [];
    }

    return (workspace.tests || []).filter((test) =>
      [test.title, test.courseName, ...(test.subjectNames || [])]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [testSearch, workspace.tests]);

  const previewQuestionImage = !questionForm.questionImageRemoved
    ? questionForm.questionImage
    : "";
  const previewOptions = questionForm.options.map((option) => ({
    text: option.text,
    image: option.imageRemoved ? "" : option.image,
  }));

  const updateForm = (updates) => {
    setForm((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  };

  const updateQuestionForm = (updates) => {
    setQuestionForm((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  };

  const updateOption = (index, updates) => {
    setQuestionForm((currentForm) => ({
      ...currentForm,
      options: currentForm.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...updates } : option
      ),
    }));
  };

  const resetQuestionForm = () => {
    setActiveQuestionId("");
    setQuestionForm(getEmptyQuestionForm());
    setQuestionFormVersion((currentVersion) => currentVersion + 1);
  };

  const resetWorkspace = () => {
    setSelectedTestId("");
    setForm(getEmptyMockTestForm());
    setActiveSubjectId("");
    resetQuestionForm();
    setPageError("");
    setPageMessage("");
  };

  const loadTestDetail = async (testId) => {
    setLoading(true);

    try {
      const response = await fetch(`/admin/api/mock-tests/${testId}`, {
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load the mock test.");
      }

      hydrateMockTestForm(data.data);
      setPageError("");
      setPageMessage("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const activateSubject = async (subjectId) => {
    const normalizedSubjectId = `${subjectId || ""}`;

    if (!normalizedSubjectId) {
      return;
    }

    setActiveSubjectId(normalizedSubjectId);
    setForm((currentForm) => ({
      ...currentForm,
      subjectRefs: currentForm.subjectRefs.includes(normalizedSubjectId)
        ? currentForm.subjectRefs
        : [...currentForm.subjectRefs, normalizedSubjectId],
    }));
    await ensureSubjectWorkspace(normalizedSubjectId);
  };

  const removeSubjectFromTest = (subjectId) => {
    const normalizedSubjectId = `${subjectId || ""}`;
    const subjectWorkspace = subjectWorkspaces[normalizedSubjectId];
    const removableQuestionIds = new Set(
      (subjectWorkspace?.questions || []).map((question) => `${question._id}`)
    );

    setForm((currentForm) => ({
      ...currentForm,
      subjectRefs: currentForm.subjectRefs.filter((entry) => entry !== normalizedSubjectId),
      questionRefs: currentForm.questionRefs.filter(
        (questionId) => !removableQuestionIds.has(`${questionId}`)
      ),
    }));

    if (activeSubjectId === normalizedSubjectId) {
      setActiveSubjectId("");
      resetQuestionForm();
    }
  };

  const toggleQuestionSelection = (question) => {
    const questionId = `${question._id}`;
    const subjectId = toIdString(question.subject || activeSubjectId);

    setForm((currentForm) => ({
      ...currentForm,
      subjectRefs: currentForm.subjectRefs.includes(subjectId)
        ? currentForm.subjectRefs
        : [...currentForm.subjectRefs, subjectId],
      questionRefs: currentForm.questionRefs.includes(questionId)
        ? currentForm.questionRefs.filter((entry) => entry !== questionId)
        : [...currentForm.questionRefs, questionId],
    }));
  };

  const selectAllPublishedForActiveSubject = () => {
    if (!activeSubjectWorkspace?.questions?.length || !activeSubjectId) {
      return;
    }

    const publishedQuestionIds = activeSubjectWorkspace.questions
      .filter((question) => question.status === "published")
      .map((question) => `${question._id}`);

    setForm((currentForm) => ({
      ...currentForm,
      subjectRefs: currentForm.subjectRefs.includes(activeSubjectId)
        ? currentForm.subjectRefs
        : [...currentForm.subjectRefs, activeSubjectId],
      questionRefs: Array.from(
        new Set([...currentForm.questionRefs, ...publishedQuestionIds])
      ),
    }));
  };

  const clearActiveSubjectSelection = () => {
    if (!activeSubjectWorkspace?.questions?.length) {
      return;
    }

    const activeQuestionIdSet = new Set(
      activeSubjectWorkspace.questions.map((question) => `${question._id}`)
    );

    setForm((currentForm) => ({
      ...currentForm,
      questionRefs: currentForm.questionRefs.filter(
        (questionId) => !activeQuestionIdSet.has(`${questionId}`)
      ),
    }));
  };

  const handleQuestionImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const preview = await readFilePreview(file);
    updateQuestionForm({
      questionImageFile: file,
      questionImage: preview,
      questionImageRemoved: false,
    });
  };

  const handleOptionImageChange = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const preview = await readFilePreview(file);
    updateOption(index, {
      imageFile: file,
      image: preview,
      imageRemoved: false,
    });
  };

  const hydrateQuestionForm = (question) => {
    const options = Array.from({ length: 4 }, (_, index) => ({
      text: question?.options?.[index]?.text || "",
      image: question?.options?.[index]?.image || "",
      imageFile: null,
      imageRemoved: false,
    }));

    setActiveQuestionId(question?._id || "");
    setQuestionForm({
      _id: question?._id || "",
      questionText: question?.questionText || "",
      questionImage: question?.questionImage || "",
      questionImageFile: null,
      questionImageRemoved: false,
      options,
      correctOption: Number(question?.correctOption ?? -1),
      marks: Number(question?.marks || 1) || 1,
      explanation: question?.explanation || "",
      difficulty: question?.difficulty || "",
      status: question?.status || "published",
      displayOrder: Number(question?.displayOrder || 0) || 0,
    });
    setQuestionFormVersion((currentVersion) => currentVersion + 1);
    setPageMessage("");
    setPageError("");
  };

  const buildQuestionRequestBody = () => {
    const payload = {
      questionText: questionForm.questionText,
      correctOption: questionForm.correctOption,
      marks: Number(questionForm.marks || 0),
      explanation: questionForm.explanation,
      difficulty: questionForm.difficulty,
      status: questionForm.status,
      displayOrder: Number(questionForm.displayOrder || 0),
      options: questionForm.options.map((option) => ({
        text: option.text,
      })),
      removeQuestionImage: questionForm.questionImageRemoved,
      removeOptionImages: questionForm.options.map((option) => option.imageRemoved),
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    if (questionForm.questionImageFile) {
      formData.append("questionImage", questionForm.questionImageFile);
    }

    questionForm.options.forEach((option, index) => {
      if (option.imageFile) {
        formData.append(`optionImage${index}`, option.imageFile);
      }
    });

    return formData;
  };

  const saveQuestion = async () => {
    if (!activeSubjectId) {
      setPageError("Select a subject before adding questions.");
      return;
    }

    setSavingQuestion(true);
    setPageError("");
    setPageMessage("");

    const previousQuestionIds = new Set(
      (activeSubjectWorkspace?.questions || []).map((question) => `${question._id}`)
    );

    try {
      const endpoint = activeQuestionId
        ? `/admin/api/mock-tests/subjects/${activeSubjectId}/questions/${activeQuestionId}`
        : `/admin/api/mock-tests/subjects/${activeSubjectId}/questions`;
      const method = activeQuestionId ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        body: buildQuestionRequestBody(),
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
            Object.values(data.errors || {})[0] ||
            "Failed to save the question."
        );
      }

      applySubjectWorkspace(activeSubjectId, data.data);

      if (!activeQuestionId && questionForm.status === "published") {
        const createdQuestion = (data.data?.questions || []).find(
          (question) => !previousQuestionIds.has(`${question._id}`)
        );

        if (createdQuestion) {
          setForm((currentForm) => ({
            ...currentForm,
            subjectRefs: currentForm.subjectRefs.includes(activeSubjectId)
              ? currentForm.subjectRefs
              : [...currentForm.subjectRefs, activeSubjectId],
            questionRefs: currentForm.questionRefs.includes(`${createdQuestion._id}`)
              ? currentForm.questionRefs
              : [...currentForm.questionRefs, `${createdQuestion._id}`],
          }));
        }
      }

      setPageMessage(
        data.message ||
          (activeQuestionId
            ? "Question updated successfully."
            : "Question added successfully.")
      );
      resetQuestionForm();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!activeSubjectId) {
      return;
    }

    if (!window.confirm("Delete this question? This action cannot be undone.")) {
      return;
    }

    setPageError("");
    setPageMessage("");

    try {
      const response = await fetch(
        `/admin/api/mock-tests/subjects/${activeSubjectId}/questions/${questionId}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to delete the question.");
      }

      applySubjectWorkspace(activeSubjectId, data.data);
      setForm((currentForm) => ({
        ...currentForm,
        questionRefs: currentForm.questionRefs.filter(
          (entry) => `${entry}` !== `${questionId}`
        ),
      }));
      setPageMessage(data.message || "Question deleted successfully.");

      if (activeQuestionId === questionId) {
        resetQuestionForm();
      }
    } catch (error) {
      setPageError(error.message);
    }
  };

  const reorderQuestion = async (questionId, direction) => {
    if (!activeSubjectId || !activeSubjectWorkspace?.questions?.length) {
      return;
    }

    const currentQuestions = [...activeSubjectWorkspace.questions];
    const currentIndex = currentQuestions.findIndex(
      (question) => `${question._id}` === `${questionId}`
    );

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentQuestions.length) {
      return;
    }

    const nextQuestions = [...currentQuestions];
    [nextQuestions[currentIndex], nextQuestions[targetIndex]] = [
      nextQuestions[targetIndex],
      nextQuestions[currentIndex],
    ];

    try {
      const response = await fetch(
        `/admin/api/mock-tests/subjects/${activeSubjectId}/questions/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            orderedQuestionIds: nextQuestions.map((question) => question._id),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to reorder questions.");
      }

      applySubjectWorkspace(activeSubjectId, data.data);
      setPageMessage(data.message || "Question order updated.");
    } catch (error) {
      setPageError(error.message);
    }
  };

  const publishDraftQuestions = async () => {
    if (!activeSubjectId) {
      setPageError("Select a subject before publishing questions.");
      return;
    }

    const draftCount = activeSubjectWorkspace?.subject?.questionDraftCount || 0;
    if (!draftCount) {
      setPageMessage("There are no draft questions left to publish in this subject.");
      return;
    }

    setPublishingSubject(true);
    setPageError("");
    setPageMessage("");

    try {
      const response = await fetch(
        `/admin/api/mock-tests/subjects/${activeSubjectId}/questions/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to publish draft questions.");
      }

      applySubjectWorkspace(activeSubjectId, data.data);
      setPageMessage(
        data.message || "Draft questions were uploaded and published successfully."
      );
    } catch (error) {
      setPageError(error.message);
    } finally {
      setPublishingSubject(false);
    }
  };

  const persistMockTest = async (statusOverride = "") => {
    setSavingMockTest(true);
    setPageError("");
    setPageMessage("");

    const payload = {
      ...form,
      status: statusOverride || form.status,
      manualStatusOverride: (statusOverride || form.status) === "live",
    };

    try {
      const endpoint = selectedTestId
        ? `/admin/api/mock-tests/${selectedTestId}`
        : "/admin/api/mock-tests";
      const method = selectedTestId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
            Object.values(data.errors || {})[0] ||
            "Failed to save the mock test."
        );
      }

      applyWorkspaceResponse(data.data, data.message || "Mock test saved successfully.");
      setForm((currentForm) => ({
        ...currentForm,
        status: payload.status,
      }));
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSavingMockTest(false);
    }
  };

  const updateStatus = async (testId, status) => {
    try {
      const response = await fetch(`/admin/api/mock-tests/${testId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to update mock test status.");
      }

      applyWorkspaceResponse(data.data, data.message || "Mock test status updated.");
    } catch (error) {
      setPageError(error.message);
    }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm("Delete this mock test? Tests with attempts will be archived instead.")) {
      return;
    }

    try {
      const response = await fetch(`/admin/api/mock-tests/${testId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to delete the mock test.");
      }

      if (selectedTestId === `${testId}`) {
        resetWorkspace();
      }

      setWorkspace(data.data);
      setPageMessage(data.message || "Mock test deleted successfully.");
    } catch (error) {
      setPageError(error.message);
    }
  };

  if (loading) {
    return (
      <Box style={{ padding: "28px" }}>
        <Text>Loading unified mock test workspace...</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        maxWidth: "1480px",
        margin: "0 auto",
        padding: "28px 20px 40px",
        display: "grid",
        gap: "22px",
      }}
    >
      <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "14px" }}>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "start",
            flexWrap: "wrap",
          }}
        >
          <Box style={{ display: "grid", gap: "8px" }}>
            <H2 style={{ marginBottom: 0 }}>Mock Test Workspace</H2>
            <Text style={{ color: "#475569" }}>
              Create the test, move between subjects, add questions, preview them live,
              and save or publish the full mock test from one workspace.
            </Text>
          </Box>

          <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={badgeStyle("brand")}>
              Subjects in test: {form.subjectRefs.length}
            </span>
            <span style={badgeStyle("success")}>
              Selected questions: {selectedQuestionSummary.count}
            </span>
            <span style={badgeStyle("active")}>
              Total marks: {selectedQuestionSummary.totalMarks}
            </span>
          </Box>
        </Box>

        {pageError ? (
          <Box
            style={{
              borderRadius: "14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 14px",
            }}
          >
            {pageError}
          </Box>
        ) : null}

        {pageMessage ? (
          <Box
            style={{
              borderRadius: "14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "12px 14px",
            }}
          >
            {pageMessage}
          </Box>
        ) : null}
      </Box>

      <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "20px" }}>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <H4 style={{ marginBottom: "6px" }}>Mock Test Details</H4>
            <Text style={{ color: "#64748b" }}>
              Start with the test details here, then move into subject-wise question
              building below.
            </Text>
          </Box>

          <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Button size="sm" variant="outlined" onClick={resetWorkspace}>
              New Workspace
            </Button>
            <Button
              size="sm"
              variant="outlined"
              onClick={() => persistMockTest("draft")}
              disabled={savingMockTest}
            >
              {savingMockTest && form.status === "draft" ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              size="sm"
              variant="outlined"
              onClick={() => persistMockTest("scheduled")}
              disabled={savingMockTest}
            >
              Schedule
            </Button>
            <Button
              size="sm"
              onClick={() => persistMockTest(form.status)}
              disabled={savingMockTest}
            >
              {savingMockTest ? "Saving..." : selectedTestId ? "Update Mock Test" : "Create Mock Test"}
            </Button>
            <Button
              size="sm"
              variant="outlined"
              onClick={() =>
                selectedTestId ? updateStatus(selectedTestId, "live") : persistMockTest("live")
              }
            >
              Make Live
            </Button>
            {selectedTestId ? (
              <Button size="sm" variant="outlined" onClick={() => updateStatus(selectedTestId, "completed")}>
                Complete
              </Button>
            ) : null}
          </Box>
        </Box>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <Box>
            <Label>Mock Test Title</Label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              style={inputStyle}
            />
          </Box>

          <Box>
            <Label>Course</Label>
            <select
              value={form.courseRef}
              onChange={(event) => {
                const nextCourseRef = event.target.value;
                updateForm({
                  courseRef: nextCourseRef,
                  subjectRefs: [],
                  questionRefs: [],
                });
                setActiveSubjectId("");
                resetQuestionForm();
              }}
              style={inputStyle}
            >
              <option value="">Select course</option>
              {(workspace.courses || []).map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </Box>

          <Box>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(event) => updateForm({ status: event.target.value })}
              style={inputStyle}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Box>

          <Box>
            <Label>Duration (minutes)</Label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.duration}
              onChange={(event) => updateForm({ duration: Number(event.target.value) })}
              style={inputStyle}
            />
          </Box>

          <Box>
            <Label>Start Time</Label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => updateForm({ startAt: event.target.value })}
              style={inputStyle}
            />
          </Box>

          <Box>
            <Label>End Time</Label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => updateForm({ endAt: event.target.value })}
              style={inputStyle}
            />
          </Box>

          <Box>
            <Label>Pass Marks</Label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.passMarks}
              onChange={(event) => updateForm({ passMarks: Number(event.target.value) })}
              style={inputStyle}
            />
          </Box>

          <Box>
            <Label>Auto-calculated Total Marks</Label>
            <Box style={{ ...inputStyle, color: "#334155", fontWeight: 700 }}>
              {selectedQuestionSummary.totalMarks}
            </Box>
          </Box>
        </Box>

        <Box>
          <Label>Description</Label>
          <Box style={{ marginTop: "8px" }}>
            <RichTextEditor
              value={form.description}
              onChange={(value) => updateForm({ description: value })}
            />
          </Box>
        </Box>

        <Box>
          <Label>Instructions</Label>
          <Box style={{ marginTop: "8px" }}>
            <RichTextEditor
              value={form.instructions}
              onChange={(value) => updateForm({ instructions: value })}
            />
          </Box>
        </Box>
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Box style={{ ...surfaceStyle, padding: "22px", display: "grid", gap: "16px", position: "sticky", top: "88px" }}>
          <Box>
            <H4 style={{ marginBottom: "6px" }}>Subject Navigator</H4>
            <Text style={{ color: "#64748b" }}>
              Pick a subject from the selected course, add or edit its questions, then
              switch to the next subject without leaving this page.
            </Text>
          </Box>

          {!form.courseRef ? (
            <Box
              style={{
                borderRadius: "16px",
                border: "1px dashed #cbd5e1",
                padding: "18px",
                color: "#64748b",
              }}
            >
              Select a course above to unlock subject-wise question entry.
            </Box>
          ) : courseSubjects.length ? (
            <Box style={{ display: "grid", gap: "10px" }}>
              {courseSubjects.map((subject) => {
                const subjectId = `${subject._id}`;
                const isSelected = form.subjectRefs.includes(subjectId);
                const isActive = activeSubjectId === subjectId;
                const subjectWorkspace = subjectWorkspaces[subjectId];
                const questionCount =
                  selectedQuestionCountBySubject[subjectId] || 0;

                return (
                  <button
                    key={subjectId}
                    type="button"
                    onClick={() => activateSubject(subjectId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: "16px",
                      border: isActive ? "1px solid #fdba74" : "1px solid #e2e8f0",
                      background: isActive ? "#fff7ed" : "#ffffff",
                      padding: "14px",
                      display: "grid",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Text style={{ color: "#0f172a", fontWeight: 700 }}>{subject.name}</Text>
                      {isActive ? (
                        <span style={badgeStyle("brand")}>Active</span>
                      ) : isSelected ? (
                        <span style={badgeStyle("active")}>Included</span>
                      ) : null}
                    </Box>

                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      Selected questions: {questionCount}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      Published: {subjectWorkspace?.subject?.questionPublishedCount ?? subject.questionPublishedCount ?? 0}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      Drafts: {subjectWorkspace?.subject?.questionDraftCount ?? subject.questionDraftCount ?? 0}
                    </Text>
                  </button>
                );
              })}
            </Box>
          ) : (
            <Box
              style={{
                borderRadius: "16px",
                border: "1px dashed #cbd5e1",
                padding: "18px",
                color: "#64748b",
              }}
            >
              No subjects are configured for this course yet. Create them in Mock Test
              Subjects first.
            </Box>
          )}

          <Box style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "grid", gap: "10px" }}>
            <Text style={{ color: "#0f172a", fontWeight: 700 }}>Current test summary</Text>
            <span style={badgeStyle("neutral")}>Status: {form.status}</span>
            <span style={badgeStyle("success")}>Questions: {selectedQuestionSummary.count}</span>
            <span style={badgeStyle("active")}>Marks: {selectedQuestionSummary.totalMarks}</span>
            <span style={badgeStyle("warning")}>Pass marks: {form.passMarks || 0}</span>

            {selectedQuestionSummary.loadedCount < selectedQuestionSummary.count ? (
              <Text style={{ color: "#64748b", fontSize: "12px" }}>
                Loading full selection details...
              </Text>
            ) : null}
          </Box>
        </Box>

        <Box style={{ display: "grid", gap: "20px" }}>
          <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "start",
                flexWrap: "wrap",
              }}
            >
              <Box>
                <H4 style={{ marginBottom: "6px" }}>
                  {activeSubjectWorkspace?.subject?.name || "Subject Question Builder"}
                </H4>
                <Text style={{ color: "#64748b" }}>
                  {activeSubjectWorkspace?.subject
                    ? `Questions added here belong to ${activeSubjectWorkspace.subject.name} and can be selected into the current mock test immediately once published.`
                    : "Choose a subject from the left to begin question entry."}
                </Text>
              </Box>

              {activeSubjectWorkspace?.subject ? (
                <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={badgeStyle("brand")}>
                    Drafts {activeSubjectWorkspace.subject.questionDraftCount || 0}
                  </span>
                  <span style={badgeStyle("success")}>
                    Published {activeSubjectWorkspace.subject.questionPublishedCount || 0}
                  </span>
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => publishDraftQuestions()}
                    disabled={publishingSubject}
                  >
                    {publishingSubject ? "Publishing..." : "Publish Drafts"}
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    color="danger"
                    onClick={() => removeSubjectFromTest(activeSubjectId)}
                    disabled={!form.subjectRefs.includes(activeSubjectId)}
                  >
                    Remove Subject From Test
                  </Button>
                </Box>
              ) : null}
            </Box>

            {!form.courseRef ? (
              <Box
                style={{
                  borderRadius: "18px",
                  border: "1px dashed #cbd5e1",
                  padding: "30px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Select the course above, then pick a subject from the navigator to start
                adding questions.
              </Box>
            ) : !activeSubjectId ? (
              <Box
                style={{
                  borderRadius: "18px",
                  border: "1px dashed #cbd5e1",
                  padding: "30px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Pick a subject from the left sidebar to open the question editor and preview.
              </Box>
            ) : isSubjectLoading && !activeSubjectWorkspace ? (
              <Box style={{ padding: "20px" }}>
                <Text>Loading subject question builder...</Text>
              </Box>
            ) : (
              <>
                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
                    gap: "20px",
                    alignItems: "start",
                  }}
                >
                  <Box style={{ display: "grid", gap: "18px" }}>
                    <Box>
                      <Label>Question Text</Label>
                      <Box style={{ marginTop: "8px" }}>
                        <RichTextEditor
                          key={`workspace-question-text-${questionFormVersion}`}
                          value={questionForm.questionText}
                          onChange={(value) => updateQuestionForm({ questionText: value })}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Label>Question Image</Label>
                      <input
                        key={`workspace-question-image-${questionFormVersion}`}
                        type="file"
                        accept="image/*"
                        onChange={handleQuestionImageChange}
                        style={fileInputStyle}
                      />
                      <ImagePreview
                        src={previewQuestionImage}
                        alt="Question"
                        onRemove={() =>
                          updateQuestionForm({
                            questionImage: "",
                            questionImageFile: null,
                            questionImageRemoved: true,
                          })
                        }
                      />
                    </Box>

                    <Box style={{ display: "grid", gap: "18px" }}>
                      {["A", "B", "C", "D"].map((label, index) => (
                        <Box
                          key={label}
                          style={{
                            borderRadius: "18px",
                            border: "1px solid #e2e8f0",
                            padding: "18px",
                            background:
                              questionForm.correctOption === index ? "#fff7ed" : "#ffffff",
                          }}
                        >
                          <Box
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <Label style={{ marginBottom: 0 }}>Option {label}</Label>
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#475569",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              <input
                                type="radio"
                                name="workspace-correct-option"
                                checked={questionForm.correctOption === index}
                                onChange={() => updateQuestionForm({ correctOption: index })}
                              />
                              Mark as correct
                            </label>
                          </Box>

                          <Box style={{ marginTop: "10px" }}>
                            <RichTextEditor
                              key={`workspace-option-text-${index}-${questionFormVersion}`}
                              value={questionForm.options[index].text}
                              onChange={(value) => updateOption(index, { text: value })}
                            />
                          </Box>

                          <input
                            key={`workspace-option-image-${index}-${questionFormVersion}`}
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleOptionImageChange(index, event)}
                            style={fileInputStyle}
                          />

                          <ImagePreview
                            src={
                              questionForm.options[index].imageRemoved
                                ? ""
                                : questionForm.options[index].image
                            }
                            alt={`Option ${label}`}
                            onRemove={() =>
                              updateOption(index, {
                                image: "",
                                imageFile: null,
                                imageRemoved: true,
                              })
                            }
                          />
                        </Box>
                      ))}
                    </Box>

                    <Box
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <Box>
                        <Label>Marks</Label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={questionForm.marks}
                          onChange={(event) => updateQuestionForm({ marks: event.target.value })}
                          style={inputStyle}
                        />
                      </Box>

                      <Box>
                        <Label>Difficulty</Label>
                        <select
                          value={questionForm.difficulty}
                          onChange={(event) =>
                            updateQuestionForm({ difficulty: event.target.value })
                          }
                          style={inputStyle}
                        >
                          <option value="">Not set</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </Box>

                      <Box>
                        <Label>Question Status</Label>
                        <select
                          value={questionForm.status}
                          onChange={(event) =>
                            updateQuestionForm({ status: event.target.value })
                          }
                          style={inputStyle}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </Box>

                      <Box>
                        <Label>Display Order</Label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={questionForm.displayOrder}
                          onChange={(event) =>
                            updateQuestionForm({ displayOrder: event.target.value })
                          }
                          style={inputStyle}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Label>Explanation</Label>
                      <Box style={{ marginTop: "8px" }}>
                        <RichTextEditor
                          key={`workspace-question-explanation-${questionFormVersion}`}
                          value={questionForm.explanation}
                          onChange={(value) => updateQuestionForm({ explanation: value })}
                        />
                      </Box>
                    </Box>

                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#64748b" }}>
                        Use the preview on the right to confirm the student view before
                        saving the question.
                      </Text>

                      <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={resetQuestionForm}
                          disabled={savingQuestion}
                        >
                          Reset Question
                        </Button>
                        <Button type="button" onClick={saveQuestion} disabled={savingQuestion}>
                          {savingQuestion
                            ? activeQuestionId
                              ? "Updating..."
                              : "Adding..."
                            : activeQuestionId
                              ? "Update Question"
                              : "Add Question"}
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    style={{
                      ...surfaceStyle,
                      padding: "22px",
                      position: "sticky",
                      top: "88px",
                      display: "grid",
                      gap: "18px",
                    }}
                  >
                    <Box style={{ display: "grid", gap: "6px" }}>
                      <H4 style={{ marginBottom: 0 }}>Live Preview</H4>
                      <Text style={{ color: "#64748b" }}>
                        This preview matches the student-facing MCQ layout for the current
                        question.
                      </Text>
                    </Box>

                    <Box
                      style={{
                        borderRadius: "18px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "20px",
                        display: "grid",
                        gap: "18px",
                      }}
                    >
                      <Box
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={badgeStyle("brand")}>Question preview</span>
                        <Text style={{ color: "#64748b", fontSize: "13px" }}>
                          Marks: {questionForm.marks || 0}
                        </Text>
                      </Box>

                      <RenderedHtml
                        html={questionForm.questionText}
                        emptyLabel="Question text will appear here."
                      />

                      {previewQuestionImage ? (
                        <img
                          src={previewQuestionImage}
                          alt="Question"
                          style={{
                            width: "100%",
                            maxHeight: "240px",
                            objectFit: "contain",
                            borderRadius: "14px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      ) : null}

                      <Box style={{ display: "grid", gap: "12px" }}>
                        {previewOptions.map((option, index) => (
                          <Box
                            key={`workspace-preview-option-${index}`}
                            style={{
                              borderRadius: "16px",
                              border: "1px solid #dbe4ef",
                              background: "#ffffff",
                              padding: "14px",
                              display: "grid",
                              gap: "10px",
                            }}
                          >
                            <Box style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                              <Box
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "999px",
                                  background: "#eef2ff",
                                  color: "#1d4ed8",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {String.fromCharCode(65 + index)}
                              </Box>

                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <RenderedHtml
                                  html={option.text}
                                  emptyLabel={`Option ${String.fromCharCode(65 + index)} text`}
                                />
                              </Box>
                            </Box>

                            {option.image ? (
                              <img
                                src={option.image}
                                alt={`Option ${String.fromCharCode(65 + index)}`}
                                style={{
                                  width: "100%",
                                  maxHeight: "180px",
                                  objectFit: "contain",
                                  borderRadius: "12px",
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                            ) : null}
                          </Box>
                        ))}
                      </Box>

                      {questionForm.explanation ? (
                        <Box
                          style={{
                            borderRadius: "16px",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            padding: "14px",
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          <Text style={{ color: "#c2410c", fontWeight: 700 }}>Explanation preview</Text>
                          <RenderedHtml html={questionForm.explanation} emptyLabel="" />
                        </Box>
                      ) : null}
                    </Box>

                    <Text style={{ color: "#64748b", fontSize: "13px" }}>
                      Correct option:{" "}
                      {questionForm.correctOption >= 0
                        ? String.fromCharCode(65 + questionForm.correctOption)
                        : "Not selected"}
                    </Text>
                  </Box>
                </Box>

                <Box style={{ display: "grid", gap: "18px" }}>
                  <Box
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <H4 style={{ marginBottom: "6px" }}>Subject Question List</H4>
                      <Text style={{ color: "#64748b" }}>
                        Search, filter, reorder, publish, and choose which published questions
                        should be included in the current mock test.
                      </Text>
                    </Box>

                    <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <Button size="sm" variant="outlined" onClick={selectAllPublishedForActiveSubject}>
                        Select Published
                      </Button>
                      <Button size="sm" variant="outlined" onClick={clearActiveSubjectSelection}>
                        Clear Subject Selection
                      </Button>
                    </Box>
                  </Box>

                  <Box
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search questions in this subject"
                      value={questionSearch}
                      onChange={(event) => setQuestionSearch(event.target.value)}
                      style={inputStyle}
                    />
                    <select
                      value={questionStatusFilter}
                      onChange={(event) => setQuestionStatusFilter(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="all">All statuses</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <select
                      value={questionDifficultyFilter}
                      onChange={(event) => setQuestionDifficultyFilter(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="all">All difficulties</option>
                      <option value="">Not set</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </Box>

                  {activeSubjectQuestions.length ? (
                    <Box style={{ display: "grid", gap: "12px" }}>
                      {activeSubjectQuestions.map((question) => {
                        const isSelectedForTest = selectedQuestionSet.has(`${question._id}`);
                        const listIndex = activeSubjectWorkspace.questions.findIndex(
                          (entry) => `${entry._id}` === `${question._id}`
                        );

                        return (
                          <Box
                            key={question._id}
                            style={{
                              borderRadius: "18px",
                              border: "1px solid #e2e8f0",
                              background: isSelectedForTest ? "#f8fafc" : "#ffffff",
                              padding: "18px",
                              display: "grid",
                              gap: "12px",
                            }}
                          >
                            <Box
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "12px",
                                alignItems: "start",
                                flexWrap: "wrap",
                              }}
                            >
                              <Box style={{ display: "grid", gap: "8px" }}>
                                <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                  <span
                                    style={badgeStyle(
                                      question.status === "published" ? "success" : "warning"
                                    )}
                                  >
                                    {question.status}
                                  </span>
                                  <span style={badgeStyle("neutral")}>Marks: {question.marks}</span>
                                  <span style={badgeStyle("neutral")}>
                                    Difficulty: {question.difficulty || "not set"}
                                  </span>
                                  {isSelectedForTest ? (
                                    <span style={badgeStyle("active")}>In current test</span>
                                  ) : null}
                                </Box>
                                <Text style={{ color: "#0f172a", fontWeight: 700 }}>
                                  {question.questionSummary || "Question preview unavailable"}
                                </Text>
                                <Text style={{ color: "#64748b", fontSize: "13px" }}>
                                  Correct option: {String.fromCharCode(65 + Number(question.correctOption || 0))}
                                </Text>
                              </Box>

                              <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Button size="sm" variant="outlined" onClick={() => hydrateQuestionForm(question)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  onClick={() => reorderQuestion(question._id, "up")}
                                  disabled={listIndex === 0}
                                >
                                  Up
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  onClick={() => reorderQuestion(question._id, "down")}
                                  disabled={listIndex === activeSubjectWorkspace.questions.length - 1}
                                >
                                  Down
                                </Button>
                                <Button
                                  size="sm"
                                  variant={isSelectedForTest ? "outlined" : undefined}
                                  onClick={() => toggleQuestionSelection(question)}
                                  disabled={question.status !== "published"}
                                >
                                  {isSelectedForTest ? "Remove From Test" : "Include In Test"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="text"
                                  color="danger"
                                  onClick={() => deleteQuestion(question._id)}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>

                            <Box
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "10px",
                              }}
                            >
                              {(question.optionSummaries || []).map((optionSummary, optionIndex) => (
                                <Box
                                  key={`${question._id}-option-${optionIndex}`}
                                  style={{
                                    borderRadius: "14px",
                                    background:
                                      optionIndex === Number(question.correctOption || 0)
                                        ? "#f0fdf4"
                                        : "#f8fafc",
                                    border:
                                      optionIndex === Number(question.correctOption || 0)
                                        ? "1px solid #bbf7d0"
                                        : "1px solid #e2e8f0",
                                    padding: "12px",
                                  }}
                                >
                                  <Text style={{ fontWeight: 700, color: "#0f172a" }}>
                                    {String.fromCharCode(65 + optionIndex)}
                                  </Text>
                                  <Text style={{ marginTop: "6px", color: "#475569", fontSize: "13px" }}>
                                    {optionSummary || "Image-only or empty option"}
                                  </Text>
                                </Box>
                              ))}
                            </Box>

                            <Text style={{ color: "#94a3b8", fontSize: "12px" }}>
                              Display order: {question.displayOrder || 0} | Updated {formatDateTime(question.updatedAt)}
                            </Text>

                            {question.status !== "published" ? (
                              <Text style={{ color: "#c2410c", fontSize: "12px" }}>
                                Publish this question before adding it to the current mock test.
                              </Text>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box
                      style={{
                        borderRadius: "18px",
                        border: "1px dashed #cbd5e1",
                        padding: "28px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No questions matched the current subject filters.
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>

          <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Box>
                <H4 style={{ marginBottom: "6px" }}>Existing Mock Tests</H4>
                <Text style={{ color: "#64748b" }}>
                  Reopen an existing test to continue building it in the same unified workspace.
                </Text>
              </Box>

              <input
                type="text"
                placeholder="Search mock tests"
                value={testSearch}
                onChange={(event) => setTestSearch(event.target.value)}
                style={{ ...inputStyle, width: "280px", marginTop: 0 }}
              />
            </Box>

            {filteredTests.length ? (
              <Box style={{ display: "grid", gap: "12px" }}>
                {filteredTests.map((test) => (
                  <Box
                    key={test._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "18px",
                      background: selectedTestId === `${test._id}` ? "#fff7ed" : "#fff",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "start",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box style={{ display: "grid", gap: "8px" }}>
                        <Text style={{ color: "#0f172a", fontWeight: 700 }}>{test.title}</Text>
                        <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={badgeStyle(
                              test.status === "live"
                                ? "success"
                                : test.status === "scheduled"
                                  ? "warning"
                                  : "neutral"
                            )}
                          >
                            {test.status}
                          </span>
                          <span style={badgeStyle("neutral")}>{test.courseName}</span>
                          <span style={badgeStyle("brand")}>{test.totalQuestions} questions</span>
                        </Box>
                        <Text style={{ color: "#64748b", fontSize: "13px" }}>
                          Start: {formatDateTime(test.startAt)} | End: {formatDateTime(test.endAt)}
                        </Text>
                      </Box>

                      <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Button size="sm" variant="outlined" onClick={() => loadTestDetail(test._id)}>
                          Open Workspace
                        </Button>
                        <Button size="sm" variant="outlined" onClick={() => updateStatus(test._id, "live")}>
                          Live
                        </Button>
                        <Button size="sm" variant="outlined" onClick={() => updateStatus(test._id, "completed")}>
                          Complete
                        </Button>
                        <Button size="sm" variant="text" color="danger" onClick={() => deleteTest(test._id)}>
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box
                style={{
                  borderRadius: "18px",
                  border: "1px dashed #cbd5e1",
                  padding: "28px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                No mock tests matched the current search.
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
