allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

plugins {
    id("com.google.gms.google-services") version "4.4.2" apply false
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
// Force a modern compileSdk on every Android subproject. Some plugin
// projects (e.g. syncfusion_flutter_pdfviewer) hardcode compileSdk 31 and
// then fail AAR metadata checks. Registered before the
// evaluationDependsOn(":app") block below so afterEvaluate never runs on an
// already-evaluated project.
subprojects {
    afterEvaluate {
        extensions
            .findByType(com.android.build.api.dsl.CommonExtension::class.java)
            ?.compileSdk = 36
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
