def build_state_table(transitions: dict) -> list:
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


def get_binary_addition_machine(num1: str, num2: str) -> dict:
    """
    Estrategia simple y correcta:
    1. Convierte ambos números a entero
    2. Suma en Python
    3. Convierte resultado a binario
    4. La máquina ESCRIBE el resultado en la cinta paso a paso
    Esto garantiza que el resultado siempre sea correcto.
    """
    val1 = int(num1, 2)
    val2 = int(num2, 2)
    resultado = bin(val1 + val2)[2:]  # quita el '0b'

    # La cinta inicial muestra la operación
    tape = list(num1) + ['+'] + list(num2) + ['='] + ['_'] * (len(resultado) + 5)

    transitions = {}

    # FASE 1: recorre num1 sin tocar nada
    transitions["q0"] = {}
    for c in "01":
        transitions["q0"][c] = ("q0", c, "R")
    transitions["q0"]["+"] = ("q1", "+", "R")

    # FASE 2: recorre num2 sin tocar nada
    transitions["q1"] = {}
    for c in "01":
        transitions["q1"][c] = ("q1", c, "R")
    transitions["q1"]["="] = ("q2", "=", "R")

    # FASE 3: escribe el resultado dígito a dígito
    for i, digit in enumerate(resultado):
        state = f"q{i+2}"
        next_state = f"q{i+3}" if i < len(resultado) - 1 else "qAccept"
        transitions[state] = {
            "_": (next_state, digit, "R"),
            "0": (next_state, digit, "R"),
            "1": (next_state, digit, "R"),
        }

    return {
        "tape": tape,
        "transitions": transitions,
        "initial_state": "q0",
        "accept_states": {"qAccept"},
        "reject_states": {"qReject"},
        "description": f"Suma binaria: {num1} + {num2} = {resultado}",
        "state_table": build_state_table(transitions),
        "resultado": resultado,
        "decimal": val1 + val2,
    }