import { Resource } from '../models/Resource.js';
import { Schedule } from '../models/Schedule.js';
import { validateSlotPayload } from '../validators/slotValidator.js';

export class AvailabilityService {
  /**
   * Fetch resource by uppercase identifier (e.g. R101)
   */
  static async getResourceById(resourceId) {
    if (!resourceId) return null;
    return Resource.findOne({ resourceId: resourceId.trim().toUpperCase() });
  }

  /**
   * Suggest next available Slot ID based on existing R<number> conventions
   */
  static async getNextSlotId() {
    const resources = await Resource.find({}, 'resourceId');
    let maxNumber = 100;

    resources.forEach((r) => {
      const match = (r.resourceId || '').match(/^R(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    return `R${maxNumber + 1}`;
  }

  /**
   * Create a new Examination Slot and associated Schedule
   */
  static async createSlot(payload) {
    // 1. Input validation
    const validation = validateSlotPayload(payload);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join('; '));
      err.statusCode = 400;
      err.validationErrors = validation.errors;
      throw err;
    }

    const normalizedId = payload.resourceId.trim().toUpperCase();

    // 2. Duplicate Slot ID check
    const existing = await Resource.findOne({ resourceId: normalizedId });
    if (existing) {
      const err = new Error(`Slot with identifier '${normalizedId}' already exists. Please choose a different Slot ID.`);
      err.statusCode = 409;
      throw err;
    }

    // 3. Category & Venue normalization
    const category = (payload.category && payload.category.trim().length > 0)
      ? payload.category.trim()
      : 'General Examination SAT II';

    const venue = (payload.venue && payload.venue.trim().length > 0)
      ? payload.venue.trim()
      : 'Online Examination Portal / Lab A';

    const safeRate = Math.round((Number(payload.rate) + Number.EPSILON) * 100) / 100;

    // 4. Create Resource record
    const resource = await Resource.create({
      resourceId: normalizedId,
      name: payload.name.trim(),
      category,
      rate: safeRate,
      availability: Number(payload.availability),
      status: 'ACTIVE',
    });

    // 5. Create associated Schedule record
    const scheduleId = `SCH-${normalizedId}-01`;
    // Clean up any stray schedule with this ID if re-seeded
    await Schedule.deleteOne({ scheduleId });

    const schedule = await Schedule.create({
      scheduleId,
      resourceId: normalizedId,
      examDate: payload.examDate.trim(),
      startTime: payload.startTime.trim(),
      endTime: payload.endTime.trim(),
      category,
      venue,
      status: 'SCHEDULED',
      isDemoData: false,
    });

    return {
      ...resource.toObject(),
      schedule: schedule.toObject(),
    };
  }

  /**
   * BR2 - Check whether resource is ACTIVE and has sufficient availability
   */
  static async checkAvailability(resourceId, requestedQuantity) {
    const resource = await this.getResourceById(resourceId);
    if (!resource) {
      return {
        available: false,
        resource: null,
        message: `Resource '${resourceId}' not found`,
      };
    }

    if (resource.status !== 'ACTIVE') {
      return {
        available: false,
        resource,
        message: `Resource '${resourceId}' is currently INACTIVE and cannot be booked (BR2)`,
      };
    }

    if (resource.availability < requestedQuantity) {
      return {
        available: false,
        resource,
        message: `Insufficient availability for '${resource.name}'. Requested ${requestedQuantity}, but only ${resource.availability} available (BR2)`,
      };
    }

    return {
      available: true,
      resource,
      message: 'Resource is available',
    };
  }

  /**
   * List resources with optional search, category filter, and availability filter
   */
  static async listResources({ search, category, status, minAvailability } = {}) {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (minAvailability !== undefined && minAvailability !== null) {
      filter.availability = { $gte: Number(minAvailability) };
    }
    if (search && search.trim().length > 0) {
      const term = search.trim();
      filter.$or = [
        { resourceId: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ];
    }

    return Resource.find(filter).sort({ resourceId: 1 });
  }

  /**
   * Atomically replenish availability upon cancellation (BR9)
   */
  static async replenishAvailability(resourceId, quantity, session = null) {
    const options = session ? { session, new: true } : { new: true };
    const updated = await Resource.findOneAndUpdate(
      { resourceId: resourceId.trim().toUpperCase() },
      { $inc: { availability: quantity } },
      options
    );
    return updated;
  }
}
