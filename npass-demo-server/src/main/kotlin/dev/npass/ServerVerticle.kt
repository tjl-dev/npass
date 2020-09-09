package dev.npass


import dev.npass.Util.log
import dev.npass.games.nanobomb.Nanobomb
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Handler
import io.vertx.core.http.HttpHeaders
import io.vertx.ext.web.Router
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
import io.vertx.ext.web.handler.*
import io.vertx.ext.web.sstore.LocalSessionStore
import io.vertx.kotlin.core.http.listenAwait
import io.vertx.kotlin.core.json.get
import io.vertx.kotlin.coroutines.CoroutineVerticle
import java.time.LocalDateTime
import java.time.ZoneOffset

object Util {
    fun getTimestamp() = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC).toString()
    fun getExpiry(lifeSeconds: Long) = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC).plus(lifeSeconds).toString()
    fun log(msg: String) = println("${LocalDateTime.now()}: ${msg}")
}

class ServerVerticle: CoroutineVerticle()
{
    private lateinit var httpClient: WebClient
    private lateinit var nPassAuthProvider: NPassAuthProvider
    private lateinit var nPassAuthHandler: JWTAuthHandler
    private lateinit var redirectAuthHandler: AuthHandler

    val staticHandler = StaticHandler.create()
            .setCachingEnabled(false)
            .setAllowRootFileSystemAccess(true)

    override suspend fun start() {
        log("init nPass Demo Server.")
        val webroot: String = this.config["webroot"]
        staticHandler.setWebRoot(webroot)

        val router = Router.router(vertx)
        val clientOptions = WebClientOptions().setConnectTimeout(60000)
        httpClient = WebClient.create(vertx, clientOptions)
        nPassAuthProvider = NPassAuthProvider(httpClient)
        nPassAuthHandler = NPassAuthHandler(nPassAuthProvider, null)
        redirectAuthHandler = RedirectAuthHandler.create(nPassAuthProvider, "/npass/login")

        // Build Vert.x Web router
        router.route().handler(LoggerHandler.create(LoggerFormat.DEFAULT))
        router.route().handler(BodyHandler.create())
        router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)).setAuthProvider(nPassAuthProvider))

        // Handle login -> post token
        router.post("/npass/login*").handler(postLoginHandler)

        // this will ensure each protected url has a JWT user with a valid nPassToken, or is redirected to login
        router.route("/npass/protected*").handler(nPassAuthHandler).failureHandler(redirectAuthHandler)

        // protected routes
        router.get("/npass/protected/images/*").handler(staticHandler).failureHandler(redirectAuthHandler)
        router.get("/npass/protected/videos/*").handler(staticHandler).failureHandler(redirectAuthHandler)
        router.get("/npass/protected/site*").handler(staticHandler).failureHandler(redirectAuthHandler)

        // nanobomb routes
        //router.get("/npass/nanobomb/game/:sessionId/card/*").handler(nPassAuthHandler).failureHandler(redirectAuthHandler)
        router.get("/npass/nanobomb/meta").handler(Nanobomb.instance.metaHandler)
        router.get("/npass/nanobomb/game/new/:address").handler(Nanobomb.instance.newSessionHandler)
        router.get("/npass/nanobomb/game/abandon/:sessionId").handler(Nanobomb.instance.abandonSessionHandler)
        router.get("/npass/nanobomb/game/claim/:sessionId").handler(Nanobomb.instance.claimSessionHandler)
        router.get("/npass/nanobomb/game/reclaim/:sessionId").handler(Nanobomb.instance.reclaimSessionHandler)
        router.get("/npass/nanobomb/game/:sessionId").handler(Nanobomb.instance.getSessionHandler)

        router.route("/npass/nanobomb/protected/*").handler(nPassAuthHandler).failureHandler(redirectAuthHandler)
        router.get("/npass/nanobomb/protected/:sessionId/:cardId").handler(Nanobomb.instance.nanobombContentHandler).failureHandler(redirectAuthHandler) //redirects to actual image

        //static routes
        router.route("/npass/*").handler(staticHandler)
                .failureHandler { event ->  // pass back the react app for client routing
                    log("static rerouting ${event.request().path()} to index.html")
                    event.response().sendFile("${webroot}/index.html")
                }

        //support server loading of react router pages
        router.route().handler { context: RoutingContext ->
            if(!context.request().path().equals("/npass/index.html")) {
                log("rerouting ${context.request().path()} to /npass/index.html")
                context.reroute("/npass/index.html")
            }
        }

        log("Starting nPass Demo Server...")
        vertx.createHttpServer().requestHandler(router)
                .listenAwait(8082)
    }

    var postLoginHandler = Handler<RoutingContext> { context ->
        val req = context.request()
        val authHeader = req.headers().get(HttpHeaders.AUTHORIZATION)
        log("postLoginHandler: authHeader ${authHeader}")

        nPassAuthHandler.parseCredentials(context) { res ->
            if (res.succeeded()) {
                nPassAuthProvider.authenticate(res.result()) { authN ->
                    if (authN.succeeded()) {
                        val authenticated = authN.result()
                        context.setUser(authenticated)
                        val tokenString = authenticated.principal().getString("nPassToken")
                        log("postLoginHandler: authenticated $tokenString")
                        req.response().end("<html><body><h1>Login successful</h1></body></html>")
                    } else {
                        log("postLoginHandler: Failed authentication ${authN.cause()}")
                        context.fail(HttpResponseStatus.FORBIDDEN.code())
                    }
                }
            }
            else {
                log("postLoginHandler: Failed authentication ${res.cause()}")
                context.fail(HttpResponseStatus.FORBIDDEN.code())
            }
        }
    }
}

// TODO
//  * support verification of token price and address against configured server static data
//  * consider protections against shared tokens - device footprint, concurrent ip access, nano address, request volume.