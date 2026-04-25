from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from turing_machine import TuringMachine
from algorithms.binary_addition import get_binary_addition_machine
from algorithms.write_name import get_write_name_machine

app = FastAPI(title="Simulador Máquina de Turing")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:4200"],
                   allow_methods=["*"], allow_headers=["*"])

class ExecuteRequest(BaseModel):
    algorithm: str
    input1: str = ""
    input2: str = ""
    step_by_step: bool = False

@app.get("/api/algorithms")
def get_algorithms():
    return [
        {"id": "binary_add",  "name": "Suma binaria",         "inputs": 2},
        {"id": "hex_mult",    "name": "Multiplicación hex",   "inputs": 2},
        {"id": "write_name",  "name": "Escribir nombre",      "inputs": 1},
    ]

@app.post("/api/execute")
def execute(req: ExecuteRequest):
    if req.algorithm == "binary_add":
        config = get_binary_addition_machine(req.input1, req.input2)
    elif req.algorithm == "write_name":
        config = get_write_name_machine(req.input1)
    else:
        raise HTTPException(404, "Algoritmo no encontrado")

    tm = TuringMachine(
        tape=config["tape"],
        transitions=config["transitions"],
        initial_state=config["initial_state"],
        accept_states=config["accept_states"],
        reject_states=config["reject_states"],
    )

    if req.step_by_step:
        steps = []
        for _ in range(500):
            if tm.current_state in tm.accept_states | tm.reject_states:
                break
            steps.append(tm.step())
        return {
            "steps": steps,
            "state_table": config["state_table"],
            "description": config["description"],
            "resultado": config.get("resultado", ""),
            "decimal": config.get("decimal", ""),
        }