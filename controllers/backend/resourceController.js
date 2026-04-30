const Resource = require('../models/Resource');

// @desc  Get wellness resources (public/student)
// @route GET /api/resources
// @access Private
const getResources = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    next(error);
  }
};

module.exports = { getResources };
