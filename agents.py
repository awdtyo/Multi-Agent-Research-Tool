from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from tools import web_search, scrape_url
import os
from dotenv import load_dotenv
load_dotenv()

# Single shared LLM for every agent chain; provider is selected by env:
# set GEMINI_API_KEY (bigger free daily token budget) or leave it empty/post
# the placeholder to use Groq.
_gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
if _gemini_key and "your_gemini_api_key_here" not in _gemini_key.lower():
    llm = ChatGoogleGenerativeAI(
        api_key=_gemini_key,
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        temperature=0,
    )
else:
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)

#1st agent
def build_search_agent():
    return create_agent(
        model = llm,
        tools = [web_search]
    )
#2nd agent
def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url]
    )
#writer chain
writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports. Cite every factual claim with an inline [n] citation tag, where n is the number of the source block it came from (e.g. [1], [2]); the reader renders these as links."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()


#critic chain
critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()




