import time
import asyncio
from typing import Dict, Any, List, Optional
from functools import lru_cache
from app.core.logging import logger


class PolicyCache:
    """
    In-memory LRU query cache for RAG policy retrieval.
    """
    def __init__(self, maxsize: int = 128):
        self.cache: Dict[str, Any] = {}
        self.maxsize = maxsize

    def get(self, query: str) -> Optional[Any]:
        return self.cache.get(query.lower())

    def put(self, query: str, results: Any):
        if len(self.cache) >= self.maxsize:
            # Simple FIFO eviction
            first_key = next(iter(self.cache))
            del self.cache[first_key]
        self.cache[query.lower()] = results


policy_cache = PolicyCache()


class PerformanceBenchmark:
    @staticmethod
    async def measure_concurrent_investigations(num_concurrent: int = 10) -> Dict[str, Any]:
        from app.harness import InvestigationHarness

        start_time = time.time()
        tasks = []
        for i in range(num_concurrent):
            harness = InvestigationHarness(max_steps=30)
            st = harness.initialize_case(f"PERF-TXN-{i+100}")
            tasks.append(harness.run_to_completion(st))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration_s = time.time() - start_time

        successful = sum(1 for r in results if not isinstance(r, Exception) and r.status in ["HUMAN_REVIEW", "FINAL_DECISION"])

        return {
            "num_concurrent": num_concurrent,
            "total_duration_seconds": round(duration_s, 2),
            "throughput_cases_per_sec": round(successful / max(0.01, duration_s), 2),
            "success_rate": round(successful / num_concurrent, 2)
        }


performance_benchmark = PerformanceBenchmark()
