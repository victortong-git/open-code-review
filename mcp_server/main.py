from fastapi import FastAPI, HTTPException
from typing import Any, Dict
import mcp_tools

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "MCP Server is running"}

@app.get("/mcp/source_code/{file_id}")
async def get_source_code(file_id: str):
    result = mcp_tools.get_source_code(file_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result)
    return result

@app.post("/mcp/analyze")
async def analyze_code(request: Dict[str, Any]):
    file_id = request.get("file_id")
    review_type = request.get("review_type")
    if not file_id:
        raise HTTPException(status_code=400, detail={"error": "file_id is required"})
    if not review_type:
        review_type = "general_review"
    result = await mcp_tools.analyze_code(file_id, review_type)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result)
    return result

@app.post("/mcp/findings")
async def create_finding(finding: Dict[str, Any]):
    result = mcp_tools.create_finding_record(finding)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result)
    return result