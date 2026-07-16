import { test } from "node:test";
import assert from "node:assert/strict";
import { pickWinMainPid } from "../src/pulse.mjs";

test("pickWinMainPid: 多进程数组挑不含 --type= 的主进程", () => {
  const json = JSON.stringify([
    { ProcessId: 111, CommandLine: "C:\\...\\ChatGPT.exe --type=gpu-process" },
    { ProcessId: 222, CommandLine: "C:\\...\\ChatGPT.exe --type=renderer" },
    { ProcessId: 333, CommandLine: "C:\\...\\ChatGPT.exe" },
  ]);
  assert.equal(pickWinMainPid(json), 333);
});

test("pickWinMainPid: 单对象(ConvertTo-Json 单结果不是数组)", () => {
  const json = JSON.stringify({ ProcessId: 444, CommandLine: "C:\\...\\ChatGPT.exe --profile x" });
  assert.equal(pickWinMainPid(json), 444);
});

test("pickWinMainPid: 全是 helper 或空 → null", () => {
  assert.equal(pickWinMainPid(JSON.stringify([{ ProcessId: 1, CommandLine: "ChatGPT.exe --type=utility" }])), null);
  assert.equal(pickWinMainPid(""), null);
  assert.equal(pickWinMainPid("not json"), null);
});
