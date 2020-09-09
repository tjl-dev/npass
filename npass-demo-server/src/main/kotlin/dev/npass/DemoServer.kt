package dev.npass

import io.vertx.core.DeploymentOptions
import io.vertx.core.Vertx
import io.vertx.core.VertxOptions
import io.vertx.core.buffer.Buffer
import io.vertx.core.eventbus.MessageCodec
import io.vertx.core.file.FileSystemOptions
import io.vertx.kotlin.core.deployVerticleAwait
import io.vertx.kotlin.core.deploymentOptionsOf
import io.vertx.kotlin.core.json.jsonObjectOf

suspend fun main(args: Array<String>) {
    val options = VertxOptions()
    options.fileSystemOptions = FileSystemOptions().setClassPathResolvingEnabled(false)
    val vertx = Vertx.vertx(options)
    try {
        // location of protected and static web content
        val webroot = if (args.size > 0) args[0] else "webroot"
        var seed = if (args.size > 1) args[1] else  ""

        // TODO export to config file
        var config = jsonObjectOf(
            Pair("webroot", webroot),
            Pair("seed", seed),
            Pair("npassHost", "npass.dev"),
            Pair("npassPort", 443),
            Pair("representative", "nano_1natrium1o3z5519ifou7xii8crpxpk8y65qmkih8e8bpsjri651oza8imdd")
        )

         // allow for local delivery with no serialization
        fun Vertx.registerLocalCodec() {
            eventBus().unregisterCodec("local")
            eventBus().registerCodec(object : MessageCodec<Any, Any> {
                override fun decodeFromWire(pos: Int, buffer: Buffer?) = throw NotImplementedError()
                override fun encodeToWire(buffer: Buffer?, s: Any?) = throw NotImplementedError()
                override fun transform(s: Any?) = s
                override fun name() = "local"
                override fun systemCodecID(): Byte = -1
            })
        }
        vertx.registerLocalCodec()

        val options: DeploymentOptions = deploymentOptionsOf(config)
        vertx.deployVerticleAwait("dev.npass.games.nanobomb.PersistenceVerticle", options)
        vertx.deployVerticleAwait("dev.npass.games.nanobomb.PaymentsVerticle", options)
        vertx.deployVerticleAwait("dev.npass.ServerVerticle", options)

        println("Application started")
    } catch (exception: Throwable) {
        println("Could not start application")
        exception.printStackTrace()
    }
}
