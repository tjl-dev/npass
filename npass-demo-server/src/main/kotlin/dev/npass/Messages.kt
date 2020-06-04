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