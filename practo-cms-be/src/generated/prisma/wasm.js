
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  role: 'role',
  status: 'status',
  specialty: 'specialty',
  city: 'city',
  googleId: 'googleId',
  resetToken: 'resetToken',
  resetTokenExpiry: 'resetTokenExpiry',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLoginAt: 'lastLoginAt'
};

exports.Prisma.TopicScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  assignedDoctorId: 'assignedDoctorId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DoctorPointerScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  doctorId: 'doctorId',
  notes: 'notes',
  fileUrl: 'fileUrl',
  fileType: 'fileType',
  createdAt: 'createdAt'
};

exports.Prisma.ScriptScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  version: 'version',
  content: 'content',
  status: 'status',
  summary: 'summary',
  tags: 'tags',
  entities: 'entities',
  qualityScore: 'qualityScore',
  aiProcessedAt: 'aiProcessedAt',
  aiProcessingStatus: 'aiProcessingStatus',
  uploadedById: 'uploadedById',
  lockedById: 'lockedById',
  lockedAt: 'lockedAt',
  assignedReviewerId: 'assignedReviewerId',
  assignedAt: 'assignedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScriptReviewScalarFieldEnum = {
  id: 'id',
  scriptId: 'scriptId',
  reviewerId: 'reviewerId',
  reviewerType: 'reviewerType',
  decision: 'decision',
  comments: 'comments',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt'
};

exports.Prisma.VideoScalarFieldEnum = {
  id: 'id',
  topicId: 'topicId',
  scriptId: 'scriptId',
  title: 'title',
  description: 'description',
  videoUrl: 'videoUrl',
  thumbnailUrl: 'thumbnailUrl',
  duration: 'duration',
  fileSize: 'fileSize',
  doctorName: 'doctorName',
  specialty: 'specialty',
  language: 'language',
  city: 'city',
  ctaType: 'ctaType',
  tags: 'tags',
  transcript: 'transcript',
  transcriptUrl: 'transcriptUrl',
  summary: 'summary',
  shortSummary: 'shortSummary',
  keyTakeaways: 'keyTakeaways',
  entities: 'entities',
  qualityScore: 'qualityScore',
  relatedVideoIds: 'relatedVideoIds',
  aiProcessedAt: 'aiProcessedAt',
  aiProcessingStatus: 'aiProcessingStatus',
  status: 'status',
  version: 'version',
  uploadedById: 'uploadedById',
  lockedById: 'lockedById',
  lockedAt: 'lockedAt',
  publishedById: 'publishedById',
  publishedAt: 'publishedAt',
  assignedReviewerId: 'assignedReviewerId',
  assignedAt: 'assignedAt',
  deepLink: 'deepLink',
  viewCount: 'viewCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VideoReviewScalarFieldEnum = {
  id: 'id',
  videoId: 'videoId',
  reviewerId: 'reviewerId',
  reviewerType: 'reviewerType',
  decision: 'decision',
  comments: 'comments',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  scriptId: 'scriptId',
  videoId: 'videoId',
  authorId: 'authorId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  readAt: 'readAt',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.VideoAnalyticsScalarFieldEnum = {
  id: 'id',
  videoId: 'videoId',
  views: 'views',
  uniqueViews: 'uniqueViews',
  avgWatchTime: 'avgWatchTime',
  ctr: 'ctr',
  quizStarted: 'quizStarted',
  quizCompleted: 'quizCompleted',
  consultClicked: 'consultClicked',
  consultCompleted: 'consultCompleted',
  hookRate3s: 'hookRate3s',
  hookRate5s: 'hookRate5s',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MEDICAL_AFFAIRS: 'MEDICAL_AFFAIRS',
  BRAND_REVIEWER: 'BRAND_REVIEWER',
  DOCTOR: 'DOCTOR',
  AGENCY_POC: 'AGENCY_POC',
  CONTENT_APPROVER: 'CONTENT_APPROVER',
  PUBLISHER: 'PUBLISHER'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.TopicStatus = exports.$Enums.TopicStatus = {
  ASSIGNED: 'ASSIGNED',
  DOCTOR_INPUT_PENDING: 'DOCTOR_INPUT_PENDING',
  DOCTOR_INPUT_RECEIVED: 'DOCTOR_INPUT_RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

exports.ScriptStatus = exports.$Enums.ScriptStatus = {
  DRAFT: 'DRAFT',
  MEDICAL_REVIEW: 'MEDICAL_REVIEW',
  BRAND_REVIEW: 'BRAND_REVIEW',
  DOCTOR_REVIEW: 'DOCTOR_REVIEW',
  APPROVED: 'APPROVED',
  LOCKED: 'LOCKED',
  REJECTED: 'REJECTED'
};

exports.ReviewDecision = exports.$Enums.ReviewDecision = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.CTAType = exports.$Enums.CTAType = {
  QUIZ: 'QUIZ',
  CONSULT: 'CONSULT',
  VAULT: 'VAULT'
};

exports.VideoStatus = exports.$Enums.VideoStatus = {
  DRAFT: 'DRAFT',
  BRAND_REVIEW: 'BRAND_REVIEW',
  MEDICAL_REVIEW: 'MEDICAL_REVIEW',
  DOCTOR_REVIEW: 'DOCTOR_REVIEW',
  APPROVED: 'APPROVED',
  LOCKED: 'LOCKED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  REJECTED: 'REJECTED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  EMAIL: 'EMAIL',
  IN_APP: 'IN_APP'
};

exports.Prisma.ModelName = {
  User: 'User',
  Topic: 'Topic',
  DoctorPointer: 'DoctorPointer',
  Script: 'Script',
  ScriptReview: 'ScriptReview',
  Video: 'Video',
  VideoReview: 'VideoReview',
  Comment: 'Comment',
  Notification: 'Notification',
  AuditLog: 'AuditLog',
  VideoAnalytics: 'VideoAnalytics'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
