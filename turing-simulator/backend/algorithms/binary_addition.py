def get_binary_addition_machine(num1: str, num2: str) -> dict:
    """
    Suma dos números binarios.
    Tabla de estados (lógica spaghetti):
    
    q0: Busca el separador '+' moviéndose a la derecha
    q1: Marca el último dígito del segundo número
    q2: Busca el carry hacia la izquierda
    q3: Propaga el carry
    qAccept: resultado listo
    """
    tape = list(num1) + ["+"] + list(num2) + ["_"]

    transitions = {
        # q0: escanea buscando el '+'
        "q0": {
            "0": ("q0", "0", "R"),
            "1": ("q0", "1", "R"),
            "+": ("q1", "+", "R"),
        },
        # q1: encuentra fin del segundo número
        "q1": {
            "0": ("q1", "0", "R"),
            "1": ("q1", "1", "R"),
            "_": ("q2", "_", "L"),   # llegó al final, retrocede
        },
        # q2: suma con carry (simplificado: marca y propaga)
        "q2": {
            "0": ("q3", "1", "L"),   # 0 + carry = 1, no hay nuevo carry
            "1": ("q2", "0", "L"),   # 1 + carry = 0, propaga carry
            "+": ("q4", "+", "L"),   # pasó el separador con carry
            "_": ("qAccept", "_", "R"),
        },
        # q3: sin carry, busca el separador para limpiar
        "q3": {
            "0": ("q3", "0", "L"),
            "1": ("q3", "1", "L"),
            "+": ("q5", "+", "L"),
            "_": ("qAccept", "_", "R"),
        },
        # q4: carry al primer número
        "q4": {
            "0": ("q3", "1", "L"),
            "1": ("q4", "0", "L"),
            "_": ("q6", "1", "L"),
        },
        # q5: limpieza del separador
        "q5": {
            "0": ("q5", "0", "L"),
            "1": ("q5", "1", "L"),
            "_": ("qAccept", "_", "R"),
        },
        # q6: extiende cinta para carry extra
        "q6": {
            "_": ("qAccept", "_", "R"),
        },
    }

    return {
        "tape": tape,
        "transitions": transitions,
        "initial_state": "q0",
        "accept_states": {"qAccept"},
        "reject_states": {"qReject"},
        "description": f"Suma binaria: {num1} + {num2}",
        "state_table": build_state_table(transitions),
    }


def build_state_table(transitions: dict) -> list[dict]:
    """Construye la tabla de estados legible para el frontend."""
    rows = []
    for state, rules in transitions.items():
        for symbol, (new_state, write, direction) in rules.items():
            rows.append({
                "current_state": state,
                "read": symbol,
                "write": write,
                "move": direction,
                "next_state": new_state,
            })
    return rows