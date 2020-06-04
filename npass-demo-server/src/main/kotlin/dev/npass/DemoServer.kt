package dev.npass

import io.vertx.core.DeploymentOptions
import io.vertx.core.Vertx
import io.vertx.core.VertxOptions
import io.vertx.core.file.FileSystemOptions
import io.vertx.kotlin.core.deployVerticleAwait
import io.vertx.kotlin.core.deploymentOptionsOf
import io.vertx.kotlin.core.json.*

suspend fun main(args: Array<String>) {
    val options = VertxOptions()
    options.fileSystemOptions = FileSystemOptions().setClassPathResolvingEnabled(false)
    val vertx = Vertx.vertx(options)
    try {
        // pass in the location of protected and static web content. For example site, this can be example\build
        val webroot = if (args.size > 0) args[0] else ""

        var config = json {
            obj("webroot" to webroot)
        }

        val options: DeploymentOptions = deploymentOptionsOf(config)
        vertx.deployVerticleAwait("dev.npass.ServerVerticle", options)

        println("Application started")
    } catch (exception: Throwable) {
        println("Could not start application")
        exception.printStackTrace()
    }
}
