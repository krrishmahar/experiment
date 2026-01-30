import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

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

const JUDGE0_LANG_IDS: any = {
    'javascript': 63,
    'typescript': 74, // TypeScript (3.7.4)
    'python': 71, // Python (3.8.1)
    'java': 62, // Java (OpenJDK 13.0.1)
    'cpp': 54, // C++ (GCC 9.2.0)
    'c': 50 // C (GCC 9.2.0)
};

function validateCode(code: string, language: string): boolean {
    if (!code || code.trim().length < 1) return false;
    return true; // Simplified validation
}

function wrapCode(code: string, language: string, problem: any): string {
    const testCasesJSON = JSON.stringify(problem.testCases.map((tc: any) => tc.params));
    const functionName = problem.functionName;

    switch (language) {
        case 'javascript':
            return `${code}
            
            // Test Runner
            const testCases = ${testCasesJSON};
            
            const startTime = performance.now();
            testCases.forEach((tc, index) => {
                try {
                    const result = ${functionName}(tc.nums, tc.target);
                    console.log(\`Test Case \${index + 1}: \${JSON.stringify(result)}\`);
                } catch (e) {
                     console.log(\`Test Case \${index + 1}: Error - \${e.message}\`);
                }
            });
            const endTime = performance.now();
            console.log(\`METRICS: TIME=\${(endTime - startTime).toFixed(4)}ms\`);
            `;
        case 'typescript':
            // Judge0 might run TS directly or compile. ID 74 is TS.
            // It usually expects a single file. 
            return `${code}
           
           // Test Runner
           const testCases = ${testCasesJSON};
           
           const startTime = performance.now();
           testCases.forEach((tc: any, index: number) => {
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
            // Merge classes. Remove 'public' from Solution class.
            // Ensure Main is the only public class? Judge0 often runs the class named Main or based on filename.
            // We'll create a class structure where Solution is a static inner class or separate non-public class.
            // Simplest: separate class, but remove 'public'.
            const sanitizedCode = code.replace(/public\s+class\s+Solution/, 'class Solution');
            return `
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

${sanitizedCode}

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
        case 'c':
            // C++ also needs basic structure. 
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

app.post('/api/execute', async (req, res) => {
    const { code, language, problemId } = req.body;
    console.log(`[EXECUTE] Request received for ${problemId} in ${language}`);

    const problem = PROBLEMS[problemId || 'two-sum'];

    if (!validateCode(code, language)) {
        return res.status(400).json({ status: 'Invalid', output: 'Code validation failed.', results: [] });
    }

    // Save Submission
    const submissionId = Date.now();
    const ext = language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : 'ts';
    const filename = `submission_${submissionId}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), code);
    console.log(`[EXECUTE] Saved submission to ${filename}`);

    const wrappedCode = wrapCode(code, language, problem);
    const judge0Id = JUDGE0_LANG_IDS[language];

    if (!judge0Id) {
        return res.status(400).json({ status: 'Error', output: 'Unsupported Language', results: [] });
    }

    try {
        const payload = {
            source_code: Buffer.from(wrappedCode).toString('base64'),
            language_id: judge0Id,
            stdin: Buffer.from("").toString('base64')
        };

        console.log(`[JUDGE0] Sending to localhost:2358... LangID: ${judge0Id}`);
        console.log(`[JUDGE0] Payload:`, JSON.stringify(payload));

        // Send to Judge0
        const response = await fetch('http://localhost:2358/submissions?base64_encoded=true&wait=true', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Judge0 responded with status: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();
        console.log(`[JUDGE0] Response received. Status ID: ${data.status?.id} (${data.status?.description})`);

        // Check if Judge0 accepted it
        if (!data.stdout && data.stderr) {
            // Compilation or Runtime Error
            // Decode stderr
            const stderr = Buffer.from(data.stderr, 'base64').toString('utf-8');
            console.log(`[JUDGE0] Stderr: ${stderr}`);
            return res.json({
                status: 'Runtime Error',
                output: stderr,
                results: [],
                metrics: { time: 0 }
            });
        }

        if (data.status.id === 6) { // Compilation Error in Judge0
            const compileOutput = Buffer.from(data.compile_output || "", 'base64').toString('utf-8');
            console.log(`[JUDGE0] Compilation Error: ${compileOutput}`);
            return res.json({
                status: 'Compilation Error',
                output: compileOutput,
                results: [],
                metrics: { time: 0 }
            });
        }

        // Success (hopefully)
        const outputString = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf-8') : "";
        console.log(`[JUDGE0] Stdout: ${outputString.substring(0, 100)}...`);

        // Extract Time Metric
        const timeMatch = outputString.match(/METRICS: TIME=([\d.]+)ms/);
        const runTime = timeMatch ? parseFloat(timeMatch[1]) : (parseFloat(data.time) * 1000 || 0);

        // Parse Results
        const finalResults = problem.testCases.map((tc: any, index: number) => {
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

        res.json({
            status: finalResults.every((r: any) => r.status === 'Accepted') ? 'Accepted' : 'Wrong Answer',
            output: outputString.replace(/METRICS:.*\n?/, ''),
            results: finalResults,
            metrics: {
                time: runTime
            }
        });

    } catch (error: any) {
        console.error("Judge0 Error:", error);
        res.status(500).json({ status: 'Error', output: `Judge0 Connection Failed: ${error.message}. Is Judge0 running on port 2358?`, results: [] });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using Judge0 at http://localhost:2358`);
});
