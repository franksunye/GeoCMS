import streamlit as st
import requests

st.title("GEO CMS PoC")
prompt = st.text_input("Enter prompt:")
if st.button("Run"):
    resp = requests.post("http://localhost:8000/run-prompt", json={"prompt": prompt}).json()
    st.markdown("**Generated Content:**")
    st.text(resp["content"]) 