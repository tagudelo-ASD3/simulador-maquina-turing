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


def get_write_name_machine(name: str) -> dict:
    # Detecta si debe borrar al final
    borrar = False
    if '|BORRAR' in name:
        name = name.replace('|BORRAR', '')
        borrar = True

    chars = list(name.upper()) if not any(c.islower() for c in name) else list(name)
    tape = ["_"] * (len(chars) * 2 + 10)
    transitions = {}

    # Estados de escritura
    for i, char in enumerate(chars):
        state = f"q{i}"
        next_state = f"q{i+1}" if i < len(chars) - 1 else ("qBorrar0" if borrar else "qAccept")
        transitions[state] = {
            "_": (next_state, char, "R"),
            char: (next_state, char, "R"),
        }
        # Para cualquier otro símbolo también avanza
        for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.*":
            if c not in transitions[state]:
                transitions[state][c] = (next_state, char, "R")

    # Estados de borrado (vuelve hacia la izquierda borrando)
    if borrar:
        all_chars = set(chars + list("ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.*"))
        transitions["qBorrar0"] = {
            "_": ("qBorrar1", "_", "L"),
        }
        transitions["qBorrar1"] = {}
        for c in all_chars:
            transitions["qBorrar1"][c] = ("qBorrar1", "_", "L")
        transitions["qBorrar1"]["_"] = ("qAccept", "_", "R")

    return {
        "tape": tape,
        "transitions": transitions,
        "initial_state": "q0",
        "accept_states": {"qAccept"},
        "reject_states": {"qReject"},
        "description": f"Escribir: {name}" + (" + borrar" if borrar else ""),
        "state_table": build_state_table(transitions),
    }