import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Daytona } from '@daytonaio/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Daytona Client Initialization
const daytona = new Daytona({
    apiKey: process.env.TEST_BOX || 'dtn_fd9df76fc1d41a955730711016f3e18aaea19a9780a2646eed94d954ac2fcf8d'
});

// Problem Registry
const PROBLEMS: any = {
    'two-sum': {
        id: 'two-sum',
        title: 'Two Sum',
        testCases: [
            { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]", hidden: false, params: { nums: [2, 7, 11, 15], target: 9 } },
            { input: "nums = [3,2,4], target = 6", expected: "[1,2]", hidden: false, params: { nums: [3, 2, 4], target: 6 } },
            { input: "nums = [3,3], target = 6", expected: "[0,1]", hidden: true, params: { nums: [3, 3], target: 6 } }
        ],
        functionName: 'twoSum'
    },
    'binary-search': {
        id: 'binary-search',
        title: 'Binary Search',
        testCases: [
            { input: "nums = [-1,0,3,5,9,12], target = 9", expected: "4", hidden: false, params: { nums: [-1, 0, 3, 5, 9, 12], target: 9 } },
            { input: "nums = [-1,0,3,5,9,12], target = 2", expected: "-1", hidden: false, params: { nums: [-1, 0, 3, 5, 9, 12], target: 2 } },
            { input: "nums = [5], target = 5", expected: "0", hidden: true, params: { nums: [5], target: 5 } }
        ],
        functionName: 'search'
    }
};

function validateCode(code: string, language: string): boolean {
    if (!code || code.trim().length < 10) return false;
    const keywords: any = {
        'javascript': ['function', 'return'],
        'typescript': ['function', 'return'],
        'python': ['def', 'return'],
        'java': ['class', 'public', 'static'],
        'cpp': ['class', 'public', 'vector']
    };
    const langKeywords = keywords[language] || [];
    return langKeywords.some((k: string) => code.includes(k)) || code.length > 50;
}

function wrapCode(code: string, language: string, problem: any): string {
    const testCasesJSON = JSON.stringify(problem.testCases.map((tc: any) => tc.params));
    const functionName = problem.functionName;

    switch (language) {
        case 'javascript':
        case 'typescript':
            return `${code}
            
            // Test Runner
            const testCases = ${testCasesJSON};
            
            const startTime = performance.now();
            testCases.forEach((tc, index) => {
                try {
                    const result = ${functionName}(tc.nums, tc.target);
                    console.log(\`Test Case \${index + 1}: \${JSON.stringify(result)}\`);
                } catch (e: any) {
                     console.log(\`Test Case \${index + 1}: Error - \${e.message}\`);
                }
            });
            const endTime = performance.now();
            console.log(\`METRICS: TIME=\${(endTime - startTime).toFixed(4)}ms\`);
            `;
        case 'python':
            return `${code}
import json
import time

# Test Runner
test_cases = ${JSON.stringify(problem.testCases.map((tc: any) => tc.params))}

start_time = time.time()
for i, tc in enumerate(test_cases):
    try:
        result = ${functionName}(tc["nums"], tc["target"])
        print(f"Test Case {i+1}: {result}")
    except Exception as e:
        print(f"Test Case {i+1}: Error - {e}")
end_time = time.time()
print(f"METRICS: TIME={(end_time - start_time) * 1000}ms")
`;
        case 'java':
            // For Java, wrapCode now only generates the Main class (Runner)
            // The user code will be in Solution.java
            return `
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        long startTime = System.nanoTime();
        
        try {
            ${problem.id === 'two-sum' ? `
            int[] r1 = sol.twoSum(new int[]{2,7,11,15}, 9);
            System.out.println("Test Case 1: " + Arrays.toString(r1));
            int[] r2 = sol.twoSum(new int[]{3,2,4}, 6);
            System.out.println("Test Case 2: " + Arrays.toString(r2));
            int[] r3 = sol.twoSum(new int[]{3,3}, 6);
            System.out.println("Test Case 3: " + Arrays.toString(r3));
            ` : `
            int r1 = sol.search(new int[]{-1,0,3,5,9,12}, 9);
            System.out.println("Test Case 1: " + r1);
            int r2 = sol.search(new int[]{-1,0,3,5,9,12}, 2);
            System.out.println("Test Case 2: " + r2);
            int r3 = sol.search(new int[]{5}, 5);
            System.out.println("Test Case 3: " + r3);
            `}
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }

        long endTime = System.nanoTime();
        System.out.println("METRICS: TIME=" + (endTime - startTime) / 1000000.0 + "ms");
    }
}
`;
        case 'cpp':
            return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <chrono>

using namespace std;
using namespace std::chrono;

${code}

void printVector(const vector<int>& v) {
    cout << "[";
    for(int i=0; i<v.size(); ++i) {
        cout << v[i];
        if(i < v.size()-1) cout << ",";
    }
    cout << "]";
}

int main() {
    Solution sol;
    auto start = high_resolution_clock::now();
    
     ${problem.id === 'two-sum' ? `
    try {
        vector<int> res1 = sol.twoSum({2,7,11,15}, 9);
        cout << "Test Case 1: "; printVector(res1); cout << endl;
        vector<int> res2 = sol.twoSum({3,2,4}, 6);
        cout << "Test Case 2: "; printVector(res2); cout << endl;
        vector<int> res3 = sol.twoSum({3,3}, 6);
        cout << "Test Case 3: "; printVector(res3); cout << endl;
    } catch (...) {}
    ` : `
    try {
        int r1 = sol.search({-1,0,3,5,9,12}, 9);
        cout << "Test Case 1: " << r1 << endl;
        int r2 = sol.search({-1,0,3,5,9,12}, 2);
        cout << "Test Case 2: " << r2 << endl;
        int r3 = sol.search({5}, 5);
        cout << "Test Case 3: " << r3 << endl;
    } catch (...) {}
    `}
    
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(stop - start);
    cout << "METRICS: TIME=" << duration.count() / 1000.0 << "ms" << endl;
    
    return 0;
}
`;
        default:
            return code;
    }
}

const EXECUTION_TIMEOUT_MS = 10000; // 10 seconds

app.post('/api/execute', async (req, res) => {
    const { code, language, problemId } = req.body;
    const problem = PROBLEMS[problemId || 'two-sum'];

    // 1. Validation
    if (!validateCode(code, language)) {
        return res.status(400).json({ status: 'Invalid', output: 'Code validation failed. Please provide valid code logic.' });
    }

    const submissionId = Date.now().toString();
    const fileName = `submission_${submissionId}.${language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : 'ts'}`;
    const filePath = path.join(uploadDir, fileName);

    // Save original code
    fs.writeFileSync(filePath, code);

    let sandbox;
    try {
        // 2. Daytona Integration
        console.log(`Creating Sandbox for ${language}...`);
        sandbox = await daytona.create({
            language: language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'typescript',
        });
        console.log(`Sandbox created: ${sandbox.id}`);

        let resultObj = { result: '', exitCode: 0, error: '' };

        // Timeout Promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Time Limit Exceeded')), EXECUTION_TIMEOUT_MS)
        );

        // Execution Logic
        const executionPromise = (async () => {
            // 3. Wrap & Run Code
            if (language === 'typescript' || language === 'javascript') {
                const wrappedCode = wrapCode(code, language, problem);
                const response = await sandbox.process.codeRun(wrappedCode);
                return { result: response.result, exitCode: response.exitCode, error: '' };

            } else if (language === 'python') {
                const wrappedCode = wrapCode(code, language, problem);
                const response = await sandbox.process.codeRun(wrappedCode);
                return { result: response.result, exitCode: response.exitCode, error: '' };

            } else if (language === 'java') {
                // Write Solution.java
                await sandbox.fs.uploadFile(Buffer.from(code), '/home/daytona/Solution.java');

                // Write Main.java (Runner)
                const runnerCode = wrapCode('', language, problem);
                await sandbox.fs.uploadFile(Buffer.from(runnerCode), '/home/daytona/Main.java');

                const compile = await sandbox.process.executeCommand('javac /home/daytona/Solution.java /home/daytona/Main.java');
                if (compile.exitCode !== 0) {
                    return { result: compile.result, exitCode: compile.exitCode, error: 'Compilation Error' };
                } else {
                    const run = await sandbox.process.executeCommand('java -cp /home/daytona Main');
                    return { result: run.result, exitCode: run.exitCode, error: '' };
                }

            } else if (language === 'cpp') {
                const wrappedCode = wrapCode(code, language, problem);
                await sandbox.fs.uploadFile(Buffer.from(wrappedCode), '/home/daytona/solution.cpp');
                const compile = await sandbox.process.executeCommand('g++ /home/daytona/solution.cpp -o /home/daytona/solution');
                if (compile.exitCode !== 0) {
                    return { result: compile.result, exitCode: compile.exitCode, error: 'Compilation Error' };
                } else {
                    const run = await sandbox.process.executeCommand('/home/daytona/solution');
                    return { result: run.result, exitCode: run.exitCode, error: '' };
                }
            }
            return { result: 'Unknown Language', exitCode: 1, error: '' };
        })();

        // Race Timeout vs Execution
        try {
            resultObj = await Promise.race([executionPromise, timeoutPromise]) as any;
        } catch (e: any) {
            resultObj = { result: 'Time Limit Exceeded', exitCode: 124, error: e.message };
        }

        // 4. Parse Results & Metrics
        const outputString = resultObj.result || "";

        // Extract Time Metric
        const timeMatch = outputString.match(/METRICS: TIME=([\d.]+)ms/);
        const runTime = timeMatch ? parseFloat(timeMatch[1]) : (resultObj.exitCode === 124 ? 10000 : 0);

        // Parse Cases
        const finalResults = problem.testCases.map((tc: any, index: number) => {
            if (resultObj.exitCode !== 0 && resultObj.error === 'Time Limit Exceeded') {
                return { ...tc, actual: "Timeout", status: "Time Limit Exceeded" };
            }

            const searchStr = `Test Case ${index + 1}: `;
            const line = outputString.split('\n').find((l: string) => l.includes(searchStr));
            if (!line) return { ...tc, actual: "No Output", status: "Runtime Error" };

            const actual = line.replace(searchStr, '').trim();
            const normalize = (s: string) => s.replace(/\s+/g, '');
            const passed = normalize(actual) === normalize(tc.expected);

            if (tc.hidden) {
                return {
                    ...tc,
                    input: "Hidden",
                    expected: "Hidden",
                    actual: passed ? "Hidden" : "Hidden",
                    status: passed ? "Accepted" : "Wrong Answer"
                };
            }

            return {
                ...tc,
                actual,
                status: passed ? "Accepted" : "Wrong Answer"
            };
        });

        if (resultObj.exitCode !== 0) {
            const isTLE = resultObj.error === 'Time Limit Exceeded';
            return res.json({
                status: isTLE ? 'Time Limit Exceeded' : 'Runtime Error',
                output: resultObj.result + (resultObj.error && !isTLE ? '\n' + resultObj.error : ''),
                results: finalResults,
                metrics: { time: isTLE ? 10000 : 0 }
            });
        }

        res.json({
            status: finalResults.every((r: any) => r.status === 'Accepted') ? 'Accepted' : 'Wrong Answer',
            output: outputString.replace(/METRICS:.*\n?/, ''),
            results: finalResults,
            metrics: {
                time: runTime
            }
        });

    } catch (error: any) {
        console.error("Sandbox error:", error);
        res.json({ status: 'Error', output: error.message, results: [] });
    } finally {
        if (sandbox) {
            console.log("Deleting sandbox...");
            await daytona.delete(sandbox);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Daytona SDK dependency loaded.`);
});
