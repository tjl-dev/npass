package dev.npass

data class NPassPayment (
        val paymentRequestId: String,
        val toAddress: String,
        val fromAddress: String,
        val price: Double,
        val salt: Double? = 0.0,
        val blockHash: String,
        val blockHeight: Int? = 0,
        val timestamp: String
)

data class NPassToken (
        val tokenId: String,
        val tokenRequestId: String,
        val site: String? = null,
        val contentId: String? = null,
        val expiry: String,
        val payment: NPassPayment?
)

data class VerifyTokenRequest (
        val requestId: String,
        val tokenString: String
)

data class VerifyTokenResponse (
        val requestId: String,
        val token: NPassToken,
        val tokenStatus: NpassTokenStatus
)

enum class NpassTokenStatus {
    VALID, INVALID, EXPIRED
}

data class PaymentRequest(
        val address: String,
        val amount: Double,
        val requestId: String
)

data class PaymentReceipt(
        val requestId: String,
        val request: PaymentRequest,
        val result: BlockPublishResult
)

data class AccountInfoRequest (
        val action: String,
        val account: String
)

data class AccountInfoResponse (
        val frontier: String?,
        val open_block: String?,
        val representative_block: String?,
        val balance: String?,
        val modified_timestamp: String?,
        val confirmation_height: String,
        val account_version: String?
)

data class AccountBalanceResponse (
        val balance: String?,
        val pending: String?
)

data class AccountsPendingRequest (
        val action: String,
        val accounts: List<String>,
        val source: Boolean = true,
        val include_only_confirmed: Boolean = true
)

data class BlockPendingInfo(
        val amount: String,
        val source: String
)

data class AccountsPendingResponse (
        val blocks: Map<String, Map<String, BlockPendingInfo>>
)

data class WorkRequest(
        val action: String,
        val hash: String,
        val difficulty: String
)

data class WorkResponse(
        val work: String
)

data class Block(
        val type: String,
        val previous: String,
        val account: String,
        val link: String,
        val balance: String,
        val representative: String,
        val work: String,
        val signature: String?
)

data class BlockPublish (
        val action: String = "process",
        val block: Block,
        val json_block: Boolean = true
)

data class BlockPublishResult(
        val hash: String
)