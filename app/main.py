from fastapi import FastAPI
from .api.run_prompt import router

app = FastAPI()
app.include_router(router) 