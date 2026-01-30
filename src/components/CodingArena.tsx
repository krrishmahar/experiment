import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Link } from 'react-router-dom';

const LANGUAGES = [
    { id: 'typescript', name: 'TypeScript' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
];

const PROBLEMS_DATA: any = {
    'two-sum': {
        id: 'two-sum',
        title: '1. Two Sum',
        difficulty: 'Easy',
        tags: ['Arrays', 'Hash Table'],
        description: `
            <p class="mb-4">Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
            <p class="mb-4">You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
            <p class="mb-8">You can return the answer in any order.</p>
            <h3 class="text-white font-semibold mb-3">Example 1:</h3>
            <div class="bg-[#3e3e3e]/30 p-4 rounded-lg mb-6 font-mono text-xs">
                <p><strong class="text-gray-400">Input:</strong> nums = [2,7,11,15], target = 9</p>
                <p><strong class="text-gray-400">Output:</strong> [0,1]</p>
            </div>
        `,
        boilerplates: {
            typescript: 'function twoSum(nums: number[], target: number) {\n    // Write your code here\n}',
            javascript: 'function twoSum(nums, target) {\n    // Write your code here\n}',
            python: 'def twoSum(nums, target):\n    # Write your code here\n    pass',
            java: 'public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
            cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};'
        }
    },
    'binary-search': {
        id: 'binary-search',
        title: '704. Binary Search',
        difficulty: 'Easy',
        tags: ['Arrays', 'Binary Search'],
        description: `
            <p class="mb-4">Given an array of integers <code>nums</code> which is sorted in ascending order, and an integer <code>target</code>, write a function to search <code>target</code> in <code>nums</code>. If <code>target</code> exists, then return its index. Otherwise, return <code>-1</code>.</p>
            <p class="mb-8">You must write an algorithm with <code>O(log n)</code> runtime complexity.</p>
            <h3 class="text-white font-semibold mb-3">Example 1:</h3>
            <div class="bg-[#3e3e3e]/30 p-4 rounded-lg mb-6 font-mono text-xs">
                <p><strong class="text-gray-400">Input:</strong> nums = [-1,0,3,5,9,12], target = 9</p>
                <p><strong class="text-gray-400">Output:</strong> 4</p>
            </div>
        `,
        boilerplates: {
            typescript: 'function search(nums: number[], target: number): number {\n    // Write your code here\n    return -1;\n}',
            javascript: 'function search(nums, target) {\n    // Write your code here\n    return -1;\n}',
            python: 'def search(nums, target):\n    # Write your code here\n    return -1',
            java: 'public class Solution {\n    public int search(int[] nums, int target) {\n        // Write your code here\n        return -1;\n    }\n}',
            cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your code here\n        return -1;\n    }\n};'
        }
    }
};

const CodingArena = () => {
    const [problemId, setProblemId] = useState('two-sum');
    const [language, setLanguage] = useState('typescript');
    const [code, setCode] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'testcases'>('problem');
    const [testResults, setTestResults] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<{ time: number } | null>(null);

    const problem = PROBLEMS_DATA[problemId];

    useEffect(() => {
        // Reset code when problem or language changes
        setCode(problem.boilerplates[language]);
        setTestResults([]);
        setMetrics(null);
        setStatus('');
        setOutput('');
    }, [problemId, language]);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset your code?")) {
            setCode(problem.boilerplates[language]);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('Running...');
        setStatus('Running');
        setTestResults([]);
        setMetrics(null);

        try {
            const response = await fetch('http://localhost:3001/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    problemId: problemId
                }),
            });

            const data = await response.json();

            if (data.status === 'Invalid') {
                // Basic validation error handling visually
                setOutput(`Display Logic Error: ${data.output}`);
                setStatus('Error');
                setIsRunning(false);
                return;
            }

            setOutput(data.output || 'No output log');
            setStatus(data.status);
            if (data.results) {
                setTestResults(data.results);
                if (data.metrics) setMetrics(data.metrics);
                setActiveTab('testcases');
            }
        } catch (error: any) {
            console.error(error);
            setOutput(`Error: ${error.message}`);
            setStatus('Error');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#1a1a1a] text-gray-300 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 bg-[#282828] border-b border-[#3e3e3e]">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-xl font-bold text-white hover:text-gray-300">
                        CodeArena
                    </Link>
                    <span className="text-gray-500">|</span>
                    <select
                        value={problemId}
                        onChange={(e) => setProblemId(e.target.value)}
                        className="bg-[#1a1a1a] text-white text-sm font-medium border border-[#3e3e3e] rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                    >
                        <option value="two-sum">1. Two Sum</option>
                        <option value="binary-search">704. Binary Search</option>
                    </select>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isRunning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                    <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                        Submit
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <div className="w-1/2 flex flex-col border-r border-[#3e3e3e] bg-[#282828] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex bg-[#3e3e3e]/30 border-b border-[#3e3e3e]">
                        <button
                            onClick={() => setActiveTab('problem')}
                            className={`px-4 py-2 text-xs font-medium focus:outline-none ${activeTab === 'problem' ? 'bg-[#282828] text-white border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('testcases')}
                            className={`px-4 py-2 text-xs font-medium focus:outline-none ${activeTab === 'testcases' ? 'bg-[#282828] text-white border-t-2 border-green-500' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Test Results
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'problem' ? (
                            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300">
                                <h2 className="text-2xl font-bold text-white mb-4">{problem.title}</h2>
                                <div className="flex space-x-2 mb-6">
                                    <span className="px-2 py-0.5 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">{problem.difficulty}</span>
                                    {problem.tags.map((tag: string) => (
                                        <span key={tag} className="px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-700/50 rounded-full">{tag}</span>
                                    ))}
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                            </div>
                        ) : (
                            <div>
                                {testResults.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <h3 className="text-lg font-semibold text-white">Execution Results</h3>
                                                {metrics && (
                                                    <div className="flex space-x-2 text-xs">
                                                        <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">⏱️ {metrics.time}ms</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${status === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{status}</span>
                                        </div>
                                        {testResults.map((result, idx) => (
                                            <div key={idx} className="bg-[#3e3e3e]/30 rounded-lg p-4 font-mono text-xs border border-[#3e3e3e]">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-400 font-bold">Case {idx + 1} {result.input === 'Hidden' && '(Hidden)'}</span>
                                                    <span className={result.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}>{result.status}</span>
                                                </div>
                                                {result.input !== 'Hidden' ? (
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div><span className="text-gray-500">Input:</span> <span className="text-gray-300">{result.input}</span></div>
                                                        <div><span className="text-gray-500">Expected:</span> <span className="text-gray-300">{result.expected}</span></div>
                                                        <div><span className="text-gray-500">Actual:</span> <span className={result.status === 'Accepted' ? 'text-gray-300' : 'text-red-400'}>{result.actual}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 italic">Hidden test case logic...</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 mt-20">
                                        <p>Run code to see test results</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor & Console */}
                <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
                    {/* Editor */}
                    <div className="flex-1 border-b border-[#3e3e3e] flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#282828] border-b border-[#3e3e3e]">
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span className="font-medium text-green-500">Language:</span>
                                <select
                                    className="bg-[#1a1a1a] text-gray-300 border border-[#3e3e3e] rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.id} value={lang.id}>{lang.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleReset}
                                    title="Reset Code"
                                    className="text-gray-400 hover:text-white p-1 ml-2 rounded hover:bg-[#3e3e3e] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden pt-2">
                            <Editor
                                height="100%"
                                language={language === 'c++' ? 'cpp' : language} // Monaco uses 'cpp'
                                value={code}
                                theme="vs-dark"
                                onChange={(value) => setCode(value || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    </div>

                    {/* Console/Output */}
                    <div className="h-1/3 flex flex-col bg-[#282828]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[#3e3e3e] bg-[#282828]">
                            <span className="text-sm font-medium text-gray-400">Console Output</span>
                            <button onClick={() => setOutput('')} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                            {output ? (
                                <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
                            ) : (
                                <div className="text-gray-600 italic">Console output will appear here...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingArena;
