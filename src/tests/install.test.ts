import * as assert from "assert";
import * as fs from "fs";
import { Forge, LiteLoader, MinecraftFolder, Version } from "../index";
import { Fabric } from "../libs/fabric";
import Launcher from "../libs/launch";
import { MinecraftLocation } from "../libs/utils/folder";
import { VersionMeta } from "../libs/version";


describe("Install", function () {
    async function assertNoError(version: string, loc: MinecraftLocation) {
        const diag = await Version.diagnose(version, loc);
        assert.equal(Object.keys(diag.missingAssets).length, 0, JSON.stringify(diag.missingAssets, null, 4));
        assert.equal(diag.missingLibraries.length, 0, JSON.stringify(diag.missingLibraries, null, 4));
        assert(!diag.missingAssetsIndex, "Missing Asset Index");
        assert(!diag.missingVersionJar, "Missing Version Jar");
        assert.equal(diag.missingVersionJson, "", diag.missingVersionJson);
    }
    describe("MinecraftClient", () => {
        async function installVersionClient(version: VersionMeta, gameDirectory: string) {
            const loc = new MinecraftFolder(gameDirectory);
            await Version.installTask("client", version, loc, { checksum: true }).execute();
            assert(fs.existsSync(loc.getVersionJar(version.id)));
            assert(fs.existsSync(loc.getVersionJson(version.id)));
            await assertNoError(version.id, loc);
        }
        it("should fetch minecraft version", () => Version.updateVersionMeta()).timeout(100000);
        it("should not fetch duplicate version", async () => {
            const first = await Version.updateVersionMeta();
            const sec = await Version.updateVersionMeta({ fallback: first });
            assert.equal(first, sec);
            assert.equal(first.timestamp, sec.timestamp);
        });
        it("should be able to install 1.12.2", async function () {
            await installVersionClient({
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should install 17w43b", async function () {
            await installVersionClient({
                id: "17w43b",
                type: "snapshot",
                time: "2018-01-15T11:09:31+00:00",
                releaseTime: "2017-10-26T13:36:22+00:00",
                url: "https://launchermeta.mojang.com/mc/game/0383e8585ef976baa88e2dc3357e6b9899bf263e/17w43b.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should be able to install 1.13.2", async function () {
            await installVersionClient({
                id: "1.13.2",
                type: "release",
                time: "2019-01-30T15:15:25+00:00",
                releaseTime: "2018-10-22T11:41:07+00:00",
                url: "https://launchermeta.mojang.com/v1/packages/26ec75fc9a8b990fa976100a211475d18bd97de0/1.13.2.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should be able to install 1.14.2", async function () {
            await installVersionClient({
                id: "1.14.2",
                type: "release",
                url: "https://launchermeta.mojang.com/v1/packages/bc3ada07878913436f1333ba7af7f77115427ccc/1.14.2.json",
                time: "2019-06-07T09:06:32+00:00",
                releaseTime: "2019-05-27T11:48:25+00:00",
            }, this.gameDirectory);
        }).timeout(100000000);
    });

    describe("MinecraftServer", function () {
        it("should be able to install minecraft server on 1.12.2", async function () {
            const meta = {
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
            };
            const version = await Version.install("server", meta, this.gameDirectory);
            await Launcher.ensureLibraries(new MinecraftFolder(this.gameDirectory), version);
        }).timeout(100000000);
    });

    describe("Forge", function () {
        it("should install forge on 1.12.2", async function () {
            before(() => {
                if (fs.existsSync(`${this.gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`)) {
                    fs.unlinkSync(`${this.gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`);
                }
            });
            const meta: Forge.VersionMeta = {
                mcversion: "1.12.2",
                version: "14.23.5.2823",
                universal: {
                    md5: "61e0e4606c3443eb834d9ddcbc6457a3",
                    sha1: "cec39eddde28eb6f7ac921c8d82d6a5b7916e81b",
                    path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2823/forge-1.12.2-14.23.5.2823-universal.jar",
                },
                installer: {
                    md5: "181ccfb55847f31368503746a1ae7e40",
                    sha1: "3dd9ecd967edbdb0993c9c7e6b8c55cca294f447",
                    path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2823/forge-1.12.2-14.23.5.2823-installer.jar",
                },
            };
            const result = await Forge.install(meta, new MinecraftFolder(this.gameDirectory), {
                tempDir: `${this.gameDirectory}/`,
            });
            await Version.installDependencies(await Version.parse(this.gameDirectory, result), this.gameDirectory);
            await assertNoError(result, this.gameDirectory);
        }).timeout(100000000);
        it("should install forge 1.13.2-25.0.209", async function () {
            before(() => {
                if (fs.existsSync(`${this.gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`)) {
                    fs.unlinkSync(`${this.gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`);
                }
                if (!fs.existsSync(`${this.gameDirectory}/temps`)) {
                    fs.mkdirSync(`${this.gameDirectory}/temps`);
                }
            });
            const mc = new MinecraftFolder(this.gameDirectory);
            const meta: Forge.VersionMeta = {
                mcversion: "1.13.2",
                version: "25.0.209",
                universal: {
                    md5: "d565c9d4c5c5e1f223fecd6d29ce8294",
                    sha1: "ad053f1db76e9683de0c4d6c54d0d6928a6bc1f2",
                    path: "/maven/net/minecraftforge/forge/1.13.2-25.0.209/forge-1.13.2-25.0.209-sources.jar",
                },
                installer: {
                    md5: "9870b8ebe8393d427a375d5a0f355af3",
                    sha1: "36a0bb39da14d29f9dfec61d7538937ae8af7ab9",
                    path: "/maven/net/minecraftforge/forge/1.13.2-25.0.209/forge-1.13.2-25.0.209-installer.jar",
                },
            };
            const result = await Forge.install(meta, new MinecraftFolder(this.gameDirectory), {
                tempDir: `${this.gameDirectory}/temps`,
                clearTempDirAfterInstall: false,
            });
            await Version.installDependencies(await Version.parse(this.gameDirectory, result), this.gameDirectory);
            await assertNoError(result, this.gameDirectory);
        }).timeout(100000000);
    });

    describe("Fabric", function () {
        it("should be able to install fabric", async function () {
            await Fabric.install("1.14.1+build.10", "0.4.7+build.147", this.gameDirectory);
            assert(fs.existsSync(new MinecraftFolder(this.gameDirectory).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")));
        }).timeout(100000000);
    });

    describe("Liteloader", async function () {
        it("should be able to install liteloader on 1.12.2", async function () {
            // tslint:disable-next-line:max-line-length
            const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            return LiteLoader.installAndCheck(meta, new MinecraftFolder(this.gameDirectory));
        }).timeout(100000000);
        it("should be able to install liteloader to forge", async function () {
            // tslint:disable-next-line:max-line-length
            const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            return LiteLoader.installAndCheck(meta, new MinecraftFolder(this.gameDirectory), "1.12.2-forge1.12.2-14.23.5.2823");
        }).timeout(100000000);
    });
});

