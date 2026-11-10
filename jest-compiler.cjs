"use strict";

const Module = require("module");
const path = require("path");

const typescript6 = require.resolve("@typescript/typescript6");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveTypescriptForTsJest(request, parent, isMain, options) {
  const parentFile = parent && typeof parent.filename === "string" ? parent.filename : "";
  const fromTsJest = parentFile.includes(`${path.sep}ts-jest${path.sep}`);
  if (request === "typescript" && fromTsJest) {
    return typescript6;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
