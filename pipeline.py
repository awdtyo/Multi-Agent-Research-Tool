from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain

def run_research_pipeline(topic: str) -> dict:
    state = {}
    #search agent
    search_agent = build_search_agent()
    print("\n" + "="*50)
    print("Step 1 - Search Agent is working....")
    print("="*50 + "\n")

    search_agent = build_search_agent()
    search_result = search_agent.invoke(
        {
            "messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]

        }
    )
    state["search_results"] = search_result['messages'][-1].content
    print("\n Search Result ", state['search_results'])

    #reader agent
    print("\n" + "="*50)
    print("Step 2- Reader Agent is working....")
    print("="*50 + "\n")
    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [("user",
            f"Based on the following search results about '{topic}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_results'][:800]}")]
    })
    state["scraped_content"] = reader_result['messages'][-1].content
    print("\n Scraped content: \n", state['scraped_content'])

    #writer chain
    print("\n" + "="*50 )
    print("Step 3 - Writer is drafting the report....")
    print("="*50 + "\n")
    research_combined = (
        f"SEARCH RESULTS : \n{state['search_results']}"
        f"\nDETAILED SCRAPED CONTENT: \n{state['scraped_content']}"

    )
    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined
    })

    print("\n Drafted Report\n", state['report'])
    #critic report
    print("\n"+" ="*50)
    print("step 4 - critic is reviewing the report ")
    print("="*50)

    state["feedback"] = critic_chain.invoke({
        "report":state['report']
    })

    print("\n critic report \n", state['feedback'])

    return state
if __name__ == "__main__":
    topic = input("\n Enter a research topic : ")
    run_research_pipeline(topic)