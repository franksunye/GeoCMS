from fastapi import APIRouter, Depends
from ..db import SessionLocal
from ..models import AgentPrompt, ContentBlock
from ..agents.planner import plan_task
from ..agents.writer import write_content
import uuid

router = APIRouter()

@router.post("/run-prompt")
def run_prompt(payload: dict):
    prompt_text = payload["prompt"]
    db = SessionLocal()
    prompt_id = str(uuid.uuid4())
    db.add(AgentPrompt(id=prompt_id, prompt_text=prompt_text))
    task = plan_task(prompt_text)
    result = write_content(task)
    block_id = str(uuid.uuid4())
    db.add(ContentBlock(id=block_id, prompt_id=prompt_id, content=result))
    db.commit()
    return {"prompt_id": prompt_id, "block_id": block_id, "content": result} 