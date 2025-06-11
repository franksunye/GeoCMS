from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import OpenAI

def write_content(task: dict) -> str:
    llm = OpenAI(temperature=0)
    template = PromptTemplate(input_variables=["prompt"], template="{prompt}")
    chain = LLMChain(llm=llm, prompt=template)
    return chain.run({"prompt": task["prompt"]}) 