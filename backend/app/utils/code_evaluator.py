import sys
import contextlib
import io
import traceback
from typing import Dict, Any, List

def execute_code_safely(code_str: str, function_name: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes student-submitted python code in a clean local dictionary scope
    against a list of test cases.
    Each test case is a dictionary: {"args": [arg1, arg2], "expected": expected_val}
    """
    # Simple sandboxing logic: check for imports of os, sys, subprocess, etc.
    restricted_keywords = ["import os", "import sys", "import subprocess", "open(", "eval(", "exec(", "shutil", "urllib"]
    for keyword in restricted_keywords:
        if keyword in code_str:
            return {
                "success": False,
                "score": 0.0,
                "output": "Security Alert: Restricted library or function call detected in submitted code.",
                "test_results": []
            }

    # Setup environment
    global_scope = {}
    local_scope = {}
    
    # Capture standard output
    stdout_capture = io.StringIO()
    
    try:
        # Compile and execute the function declaration
        with contextlib.redirect_stdout(stdout_capture):
            exec(code_str, global_scope, local_scope)
    except Exception as e:
        return {
            "success": False,
            "score": 0.0,
            "output": f"Compilation Error: {str(e)}\n{traceback.format_exc()}",
            "test_results": []
        }

    # Verify if the function is present in local scope
    if function_name not in local_scope:
        # Let's search for any function in local scope if the specified one isn't found
        funcs = [k for k, v in local_scope.items() if callable(v)]
        if funcs:
            function_name = funcs[0]
        else:
            return {
                "success": False,
                "score": 0.0,
                "output": f"Error: Could not find function definition in submitted code. Please ensure you defined a function.",
                "test_results": []
            }

    func = local_scope[function_name]
    
    passed_tests = 0
    total_tests = len(test_cases)
    results = []
    
    for idx, tc in enumerate(test_cases):
        args = tc.get("args", [])
        expected = tc.get("expected")
        
        try:
            # We can deepcopy args if they are mutable, to prevent mutations across tests
            result = func(*args)
            
            # Simple match
            is_pass = result == expected
            if is_pass:
                passed_tests += 1
                
            results.append({
                "test_case_index": idx,
                "args": str(args),
                "expected": str(expected),
                "received": str(result),
                "passed": is_pass,
                "error": None
            })
        except Exception as te:
            results.append({
                "test_case_index": idx,
                "args": str(args),
                "expected": str(expected),
                "received": None,
                "passed": False,
                "error": str(te)
            })

    score = float(passed_tests) / float(total_tests) if total_tests > 0 else 1.0
    stdout_content = stdout_capture.getvalue()

    return {
        "success": True,
        "score": score,
        "output": stdout_content if stdout_content else "No print outputs.",
        "test_results": results
    }


def get_mock_test_cases(topic: str) -> List[Dict[str, Any]]:
    """
    Returns mock test cases for evaluation based on generated coding topics.
    """
    # Fallback default test cases for array pair sum
    return [
        {"args": [[2, 4, 3, 5, 7, 8, 9], 7], "expected": [(2, 5), (3, 4)]},
        {"args": [[1, 2, 3, 4, 5], 5], "expected": [(1, 4), (2, 3)]},
        {"args": [[1, 1, 1], 2], "expected": [(1, 1)]}
    ]
