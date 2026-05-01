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
import { buildAdminPath } from "../config/paths.js";

const ADMIN_KATEX_STYLESHEET_ID = "sajha-admin-katex-css";
const ADMIN_KATEX_STYLESHEET_HREF = buildAdminPath("/vendor/katex/katex.min.css");

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

const fileInputStyle = {
  width: "100%",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px dashed #cbd5e1",
  padding: "10px 12px",
  background: "#f8fafc",
};

const emptyOptionState = () => ({
  text: "",
  image: "",
  imageFile: null,
  imageRemoved: false,
});

const getEmptyForm = () => ({
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
  status: "draft",
  displayOrder: 0,
});

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not yet";

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

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
    } catch (error) {
      // Keep the preview readable even if a formula is malformed.
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

export default function MockQuestionStudio(props) {
  const subjectId = props?.record?.params?._id || "";
  const [workspace, setWorkspace] = useState(null);
  const [questionForm, setQuestionForm] = useState(getEmptyForm());
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [questionFormVersion, setQuestionFormVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  const loadWorkspace = async () => {
    if (!subjectId) {
      setLoading(false);
      setPageError("Subject record could not be resolved.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        buildAdminPath(`/api/mock-test-subjects/${subjectId}/workspace`),
        {
          credentials: "same-origin",
        }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load question studio.");
      }

      setWorkspace(data.data);
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [subjectId]);

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
    setPage(1);
  }, [search, statusFilter, difficultyFilter]);

  const filteredQuestions = useMemo(() => {
    const questions = Array.isArray(workspace?.questions) ? workspace.questions : [];
    const normalizedSearch = search.trim().toLowerCase();

    return questions.filter((question) => {
      if (
        statusFilter !== "all" &&
        String(question?.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (
        difficultyFilter !== "all" &&
        String(question?.difficulty || "").toLowerCase() !== difficultyFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        question?.questionSummary,
        question?.questionText,
        question?.explanation,
        ...(question?.optionSummaries || []),
      ]
        .map((value) => stripHtml(value).toLowerCase())
        .join(" ");

      return haystack.includes(normalizedSearch);
    });
  }, [difficultyFilter, search, statusFilter, workspace]);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredQuestions.slice(startIndex, startIndex + pageSize);
  }, [filteredQuestions, page]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const draftCount = workspace?.subject?.questionDraftCount || 0;
  const publishedCount = workspace?.subject?.questionPublishedCount || 0;
  const totalCount = workspace?.subject?.totalQuestionCount || 0;

  const updateForm = (updates) => {
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

  const resetForm = () => {
    setActiveQuestionId("");
    setQuestionForm(getEmptyForm());
    setQuestionFormVersion((currentVersion) => currentVersion + 1);
    setPageError("");
  };

  const hydrateFormFromQuestion = (question) => {
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
      status: question?.status || "draft",
      displayOrder: Number(question?.displayOrder || 0) || 0,
    });
    setQuestionFormVersion((currentVersion) => currentVersion + 1);
    setPageMessage("");
    setPageError("");
  };

  const handleQuestionImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const preview = await readFilePreview(file);
    updateForm({
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
    setSaving(true);
    setPageError("");
    setPageMessage("");

    try {
      const endpoint = activeQuestionId
        ? buildAdminPath(`/api/mock-test-subjects/${subjectId}/questions/${activeQuestionId}`)
        : buildAdminPath(`/api/mock-test-subjects/${subjectId}/questions`);
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

      setWorkspace(data.data);
      setPageMessage(
        data.message ||
          (activeQuestionId
            ? "Question updated successfully."
            : "Question added successfully.")
      );
      resetForm();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const publishDraftQuestions = async () => {
    if (!draftCount) {
      setPageMessage("There are no draft questions left to upload.");
      return;
    }

    setPublishing(true);
    setPageError("");
    setPageMessage("");

    try {
      const response = await fetch(
        buildAdminPath(`/api/mock-test-subjects/${subjectId}/questions/publish`),
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
        throw new Error(data.error || "Failed to upload the draft question set.");
      }

      setWorkspace(data.data);
      setPageMessage(
        data.message || "Draft questions were uploaded and published successfully."
      );
    } catch (error) {
      setPageError(error.message);
    } finally {
      setPublishing(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question? This action cannot be undone.")) {
      return;
    }

    setPageError("");
    setPageMessage("");

    try {
      const response = await fetch(
        buildAdminPath(`/api/mock-test-subjects/${subjectId}/questions/${questionId}`),
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to delete the question.");
      }

      setWorkspace(data.data);
      setPageMessage(data.message || "Question deleted successfully.");

      if (activeQuestionId === questionId) {
        resetForm();
      }
    } catch (error) {
      setPageError(error.message);
    }
  };

  const reorderQuestion = async (questionId, direction) => {
    const currentQuestions = Array.isArray(workspace?.questions) ? [...workspace.questions] : [];
    const currentIndex = currentQuestions.findIndex((question) => `${question._id}` === `${questionId}`);

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
        buildAdminPath(`/api/mock-test-subjects/${subjectId}/questions/reorder`),
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

      setWorkspace(data.data);
      setPageMessage(data.message || "Question order updated.");
    } catch (error) {
      setPageError(error.message);
    }
  };

  const previewQuestionImage = !questionForm.questionImageRemoved
    ? questionForm.questionImage
    : "";
  const previewOptions = questionForm.options.map((option) => ({
    text: option.text,
    image: option.imageRemoved ? "" : option.image,
  }));

  if (loading) {
    return (
      <Box style={{ padding: "28px" }}>
        <Text>Loading question studio...</Text>
      </Box>
    );
  }

  if (!workspace?.subject) {
    return (
      <Box style={{ padding: "28px" }}>
        <Text color="error">Subject workspace could not be loaded.</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        maxWidth: "1460px",
        margin: "0 auto",
        padding: "28px 20px 40px",
        display: "grid",
        gap: "22px",
      }}
    >
      <Box
        style={{
          ...surfaceStyle,
          padding: "24px",
          display: "grid",
          gap: "12px",
        }}
      >
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "18px",
            flexWrap: "wrap",
            alignItems: "start",
          }}
        >
          <Box style={{ display: "grid", gap: "8px" }}>
            <H2 style={{ marginBottom: 0 }}>Question Studio</H2>
            <Text style={{ color: "#475569" }}>
              {workspace.subject.name} under {workspace.subject.course?.name || "Unknown course"}
            </Text>
          </Box>

          <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={badgeStyle("brand")}>Total {totalCount}</span>
            <span style={badgeStyle("warning")}>Drafts {draftCount}</span>
            <span style={badgeStyle("success")}>Published {publishedCount}</span>
          </Box>
        </Box>

        <Text style={{ color: "#64748b", lineHeight: 1.7 }}>
          Use the rich text editor for bold, italics, line breaks, and structured content. For
          math or science notation, type LaTeX inside <code>$...$</code>, <code>$$...$$</code>,
          <code>\(...\)</code>, or <code>\[...\]</code>. The live preview on the right renders it
          the same way students will see it.
        </Text>

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

      <Box
        style={{
          ...surfaceStyle,
          padding: "24px",
          display: "grid",
          gap: "18px",
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
          <Box>
            <H4 style={{ marginBottom: "6px" }}>Final Upload / Save</H4>
            <Text style={{ color: "#64748b" }}>
              Questions can be saved one by one as drafts. Use the button below when this subject
              is ready to publish its draft question set.
            </Text>
          </Box>

          <Button onClick={publishDraftQuestions} disabled={!draftCount || publishing}>
            {publishing ? "Uploading..." : `Upload Draft Question Set (${draftCount})`}
          </Button>
        </Box>

        <Text style={{ color: "#64748b", fontSize: "13px" }}>
          Last upload: {formatDateTime(workspace.subject.lastQuestionUploadAt)}
        </Text>
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(340px, 0.95fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "20px" }}>
          <Box style={{ display: "grid", gap: "16px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <H4 style={{ marginBottom: 0 }}>
                {activeQuestionId ? "Edit Question" : "Create Question"}
              </H4>
              {activeQuestionId ? (
                <Button variant="outlined" size="sm" onClick={resetForm}>
                  Cancel editing
                </Button>
              ) : null}
            </Box>

            <Box>
              <Label>Question text</Label>
              <Box style={{ marginTop: "8px" }}>
                <RichTextEditor
                  key={`question-text-${questionFormVersion}`}
                  value={questionForm.questionText}
                  onChange={(value) => updateForm({ questionText: value })}
                />
              </Box>
            </Box>

            <Box>
              <Label>Question image</Label>
              <input
                key={`question-image-${questionFormVersion}`}
                type="file"
                accept="image/*"
                onChange={handleQuestionImageChange}
                style={fileInputStyle}
              />
              <ImagePreview
                src={previewQuestionImage}
                alt="Question"
                onRemove={() =>
                  updateForm({
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
                    background: questionForm.correctOption === index ? "#fff7ed" : "#ffffff",
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
                        name="correct-option"
                        checked={questionForm.correctOption === index}
                        onChange={() => updateForm({ correctOption: index })}
                      />
                      Mark as correct
                    </label>
                  </Box>

                  <Box style={{ marginTop: "10px" }}>
                    <RichTextEditor
                      key={`option-text-${index}-${questionFormVersion}`}
                      value={questionForm.options[index].text}
                      onChange={(value) => updateOption(index, { text: value })}
                    />
                  </Box>

                  <input
                    key={`option-image-${index}-${questionFormVersion}`}
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
                  onChange={(event) => updateForm({ marks: event.target.value })}
                  style={inputStyle}
                />
              </Box>

              <Box>
                <Label>Difficulty</Label>
                <select
                  value={questionForm.difficulty}
                  onChange={(event) => updateForm({ difficulty: event.target.value })}
                  style={inputStyle}
                >
                  <option value="">Not set</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Box>

              <Box>
                <Label>Status</Label>
                <select
                  value={questionForm.status}
                  onChange={(event) => updateForm({ status: event.target.value })}
                  style={inputStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Box>

              <Box>
                <Label>Display order</Label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={questionForm.displayOrder}
                  onChange={(event) => updateForm({ displayOrder: event.target.value })}
                  style={inputStyle}
                />
              </Box>
            </Box>

            <Box>
              <Label>Explanation</Label>
              <Box style={{ marginTop: "8px" }}>
                <RichTextEditor
                  key={`question-explanation-${questionFormVersion}`}
                  value={questionForm.explanation}
                  onChange={(value) => updateForm({ explanation: value })}
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
                Preview stays live while you type. When the question looks correct, add it to the
                subject list below.
              </Text>

              <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Button type="button" variant="outlined" onClick={resetForm} disabled={saving}>
                  Reset form
                </Button>
                <Button type="button" onClick={saveQuestion} disabled={saving}>
                  {saving
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
        </Box>

        <Box
          style={{
            ...surfaceStyle,
            padding: "24px",
            position: "sticky",
            top: "88px",
            display: "grid",
            gap: "18px",
          }}
        >
          <Box style={{ display: "grid", gap: "6px" }}>
            <H4 style={{ marginBottom: 0 }}>Live Preview</H4>
            <Text style={{ color: "#64748b" }}>
              This is the student-facing MCQ layout preview before the question is added.
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
                  key={`preview-option-${index}`}
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

      <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Box>
            <H4 style={{ marginBottom: "6px" }}>Question List</H4>
            <Text style={{ color: "#64748b" }}>
              Search, filter, edit, delete, and reorder the questions already added under this
              subject.
            </Text>
          </Box>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              width: "min(760px, 100%)",
            }}
          >
            <input
              type="text"
              placeholder="Search questions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={inputStyle}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="all">All difficulties</option>
              <option value="">Not set</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Box>
        </Box>

        {paginatedQuestions.length ? (
          <Box style={{ display: "grid", gap: "12px" }}>
            {paginatedQuestions.map((question) => (
              <Box
                key={question._id}
                style={{
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
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
                      <span style={badgeStyle(question.status === "published" ? "success" : "warning")}>
                        {question.status}
                      </span>
                      <span style={badgeStyle("neutral")}>Marks: {question.marks}</span>
                      <span style={badgeStyle("neutral")}>
                        Difficulty: {question.difficulty || "not set"}
                      </span>
                    </Box>
                    <Text style={{ color: "#0f172a", fontWeight: 700 }}>
                      {question.questionSummary || "Question preview unavailable"}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: "13px" }}>
                      Correct option: {String.fromCharCode(65 + Number(question.correctOption || 0))}
                    </Text>
                  </Box>

                  <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Button size="sm" variant="outlined" onClick={() => hydrateFormFromQuestion(question)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => reorderQuestion(question._id, "up")}
                      disabled={workspace.questions.findIndex((item) => `${item._id}` === `${question._id}`) === 0}
                    >
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => reorderQuestion(question._id, "down")}
                      disabled={
                        workspace.questions.findIndex((item) => `${item._id}` === `${question._id}`) ===
                        workspace.questions.length - 1
                      }
                    >
                      Down
                    </Button>
                    <Button size="sm" variant="text" color="danger" onClick={() => deleteQuestion(question._id)}>
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
              </Box>
            ))}

            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text style={{ color: "#64748b" }}>
                Page {page} of {totalPages}
              </Text>
              <Box style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="sm"
                  variant="outlined"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outlined"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                  }
                >
                  Next
                </Button>
              </Box>
            </Box>
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
            No questions matched the current search or filter.
          </Box>
        )}
      </Box>
    </Box>
  );
}
