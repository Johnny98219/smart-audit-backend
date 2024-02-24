module.exports.NEW_AUDIT_RETURN_CODE = {
  success: {
    code: 0,
    message: "Contract added to audit queue"
  },
  errorFetchingDb: {
    code: 1,
    message: "Error in fetching data from database"
  },
  alreadyExist: {
    code: 2,
    message: "Contract already exists"
  },
  notErc20: {
    code: 3,
    message: "Contract is not an ERC 20"
  },
  notOpenSource: {
    code: 4,
    message: "Contract is not open source"
  },
  requested: {
    code: 5,
    message: "Contract was already requested"
  },
}

module.exports.AUDIT_STATUS_RETURN_CODE = {
  pending: 0,
  partial: 1,
  complete: 2,
  errorFetchingDb: 3,
  notRequested: 4
}
