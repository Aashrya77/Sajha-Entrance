import InquiryModel from "../models/Inquiry.js";
import CollegeModel from "../models/College.js";
import UniversityModel from "../models/University.js";

// Submit a new inquiry for a college or university
export const submitInquiry = async (req, res) => {
  try {
    const { collegeId, universityId, name, email, phone, course, message } = req.body;

    // Determine inquiry type
    const inquiryType = universityId ? "university" : "college";
    const institutionId = collegeId || universityId;

    // Validate required fields
    if (!institutionId || !name || !email || !phone || !course || !message) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    let institution;
    let institutionName;

    if (inquiryType === "college") {
      institution = await CollegeModel.findById(collegeId);
      if (!institution) {
        return res.status(404).json({
          success: false,
          error: "College not found",
        });
      }
      institutionName = institution.collegeName;
    } else {
      institution = await UniversityModel.findById(universityId);
      if (!institution) {
        return res.status(404).json({
          success: false,
          error: "University not found",
        });
      }
      institutionName = institution.universityName;
    }

    // Create new inquiry
    const inquiry = new InquiryModel({
      inquiryType,
      college: inquiryType === "college" ? collegeId : undefined,
      university: inquiryType === "university" ? universityId : undefined,
      institutionName,
      name,
      email,
      phone,
      course,
      message,
    });

    await inquiry.save();

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit inquiry",
    });
  }
};

// Get all inquiries (for admin)
export const getAllInquiries = async (req, res) => {
  try {
    const { status, inquiryType, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    if (inquiryType) {
      query.inquiryType = inquiryType;
    }

    const inquiries = await InquiryModel.find(query)
      .populate("college", "collegeName collegeEmail collegePhone")
      .populate("university", "universityName universityEmail universityPhone")
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await InquiryModel.countDocuments(query);

    res.json({
      success: true,
      data: {
        inquiries,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiries",
    });
  }
};

// Get inquiry by ID
export const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await InquiryModel.findById(id)
      .populate("college", "collegeName collegeEmail collegePhone collegeAddress")
      .populate("university", "universityName universityEmail universityPhone universityAddress");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiry",
    });
  }
};

// Update inquiry status (for admin)
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const inquiry = await InquiryModel.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    if (status) {
      inquiry.status = status;
    }
    if (notes !== undefined) {
      inquiry.notes = notes;
    }

    await inquiry.save();

    res.json({
      success: true,
      message: "Inquiry updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update inquiry",
    });
  }
};

// Delete inquiry (for admin)
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await InquiryModel.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete inquiry",
    });
  }
};

// Get inquiries by college ID (for college admin)
export const getInquiriesByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { status } = req.query;

    const query = { college: collegeId, inquiryType: "college" };
    if (status) {
      query.status = status;
    }

    const inquiries = await InquiryModel.find(query).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching college inquiries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch college inquiries",
    });
  }
};

// Get inquiries by university ID (for university admin)
export const getInquiriesByUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const { status } = req.query;

    const query = { university: universityId, inquiryType: "university" };
    if (status) {
      query.status = status;
    }

    const inquiries = await InquiryModel.find(query).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching university inquiries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch university inquiries",
    });
  }
};
