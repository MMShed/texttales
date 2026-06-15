import json
import os

FILE_NAME = "stories.json"


# ===== LOAD FILE =====
def load_data():
    if not os.path.exists(FILE_NAME):
        return {"stories": []}

    with open(FILE_NAME, "r", encoding="utf-8") as f:
        return json.load(f)


# ===== SAVE FILE =====
def save_data(data):
    with open(FILE_NAME, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ===== GENERATE STORY ID =====
def generate_story_id(stories):
    return f"story_{len(stories) + 1}"


# ===== CREATE STORY =====
def create_story(data):
    print("\n--- Create New Story ---")

    title = input("Enter title: ")
    description = input("Enter description: ")

    new_story = {
        "id": generate_story_id(data["stories"]),
        "title": title,
        "description": description,
        "nodes": []
    }

    data["stories"].append(new_story)
    save_data(data)

    print(f"\n✅ Story '{title}' created!\n")


# ===== LIST STORIES =====
def list_stories(data):
    print("\n--- Stories ---\n")

    if not data["stories"]:
        print("No stories found.\n")
        return

    for i, story in enumerate(data["stories"], start=1):
        print(f"{i}. {story['title']} ({story['id']})")

    print()


# ===== SELECT STORY =====
def select_story(data):
    if not data["stories"]:
        print("\nNo stories to edit.\n")
        return None

    list_stories(data)

    try:
        choice = int(input("Select story number: ")) - 1
        if 0 <= choice < len(data["stories"]):
            return data["stories"][choice]
        else:
            print("Invalid selection.\n")
            return None
    except ValueError:
        print("Invalid input.\n")
        return None


# ===== EDIT STORY =====
def edit_story(data):
    story = select_story(data)
    if not story:
        return

    print("\n--- Editing Story ---")
    print(f"Title: {story['title']}")
    print(f"Description: {story['description']}")
    print(f"Nodes: {len(story['nodes'])}")
    print()

    print("Type lines in format: Speaker: text")
    print("Special:")
    print("- narrator: text")
    print("- command:new_contact:Name")
    print("- /choice to branch")
    print("- /exit to stop editing\n")

    node_counter = len(story["nodes"])

    while True:
        print(f"[Current nodes: {len(story['nodes'])}]")
        line = input("> ").strip()

        if line.lower() == "/exit":
            save_data(data)
            print("\n✅ Changes saved.\n")
            break

        if not line:
            continue


        # ✅ ===== GOTO SYSTEM =====
        if line.lower().startswith("/goto"):
            parts = line.split()

            if len(parts) != 2:
                print("Usage: /goto node_X")
                continue

            target_id = parts[1]

            target_node = None

            for n in story["nodes"]:
                if n["nodeId"] == target_id:
                    target_node = n
                    break

            if not target_node:
                print(f"Node '{target_id}' not found.")
                continue

            print(f"\n✅ Jumped to {target_id}")
            print("New nodes will branch from here.\n")

            # ✅ Set this node as last node logically
            story["nodes"].append({
                "nodeId": target_id  # TEMPORARY placeholder
            })

            # ✅ Remove placeholder immediately after
            story["nodes"].pop()

            # ✅ Store pointer manually
            current_override = target_node

            continue


        # ✅ ===== CHOICE SYSTEM =====
        if line.lower() == "/choice":
            if not story["nodes"]:
                print("You need a node before creating a choice.")
                continue

            current_node = story["nodes"][-1]

            # remove linear flow
            if "nextNodeId" in current_node:
                del current_node["nextNodeId"]

            choices = []

            print("\nEnter choices (format: 1: option text). Type /done when finished:\n")

            while True:
                choice_input = input("choice> ").strip()

                if choice_input.lower() == "/done":
                    break

                if ":" not in choice_input:
                    print("Invalid format. Use: 1: option text")
                    continue

                _, text = choice_input.split(":", 1)

                placeholder_id = f"node_{node_counter}"
                node_counter += 1

                choices.append({
                    "text": text.strip(),
                    "nextNodeId": placeholder_id
                })

            if not choices:
                print("No choices added.")
                continue

            current_node["choices"] = choices
            save_data(data)

            # ✅ ===== WRITE BRANCHES =====
            for choice in choices:
                print(f"\n--- Writing branch: {choice['text']} ---")
                print("Type /endbranch to finish this branch.\n")

                prev_node = None

                while True:
                    branch_line = input("branch> ").strip()

                    if branch_line.lower() == "/endbranch":
                        if prev_node:
                            prev_node["choices"] = []  # mark ending
                        break

                    if not branch_line:
                        continue

                    # ===== COMMAND =====
                    if branch_line.startswith("command:"):
                        parts = branch_line.split(":", 2)

                        if len(parts) < 2:
                            print("Invalid command format.")
                            continue

                        node = {
                            "nodeId": f"node_{node_counter}",
                            "command": parts[1]
                        }

                        if parts[1] == "new_contact":
                            if len(parts) < 3:
                                print("Missing contact name.")
                                continue
                            node["contact_name"] = parts[2]

                    # ===== NARRATOR =====
                    elif branch_line.lower().startswith("narrator:"):
                        node = {
                            "nodeId": f"node_{node_counter}",
                            "narrator_text": branch_line.split(":", 1)[1].strip()
                        }

                    # ===== NORMAL =====
                    else:
                        if ":" not in branch_line:
                            print("Invalid format. Use Speaker: text")
                            continue

                        speaker, text = branch_line.split(":", 1)

                        if speaker.strip().lower() == "sadit":
                            speaker = "You"

                        node = {
                            "nodeId": f"node_{node_counter}",
                            "speaker": speaker.strip(),
                            "text": text.strip()
                        }

                    node_counter += 1

                    # ✅ linking inside branch
                    if prev_node:
                        prev_node["nextNodeId"] = node["nodeId"]
                    else:
                        # first node of branch
                        choice["nextNodeId"] = node["nodeId"]

                    story["nodes"].append(node)
                    prev_node = node

                    print(f"✅ Added branch node: {node['nodeId']}")

                    save_data(data)

            print("\n✅ All branches completed.\n")
            continue

        # ✅ ===== LIST NODES =====
        if line.lower() == "/list":
            print("\n--- Nodes ---")

            for node in story["nodes"]:
                print(node["nodeId"])

            print()
            continue

        # ✅ ===== INSPECT NODE =====
        if line.lower().startswith("/inspect"):
            parts = line.split()

            if len(parts) != 2:
                print("Usage: /inspect node_X")
                continue

            node_id = parts[1]

            found = None
            for node in story["nodes"]:
                if node["nodeId"] == node_id:
                    found = node
                    break

            if not found:
                print(f"Node '{node_id}' not found.")
                continue

            print("\n--- Node Details ---")
            for key, value in found.items():
                print(f"{key}: {value}")
            print()

            continue

        # ✅ ===== VIEW FULL STORY =====
        if line.lower().startswith("/view"):
            parts = line.split()

            print("\n--- Story JSON ---\n")

            if len(parts) > 1 and parts[1] == "pretty":
                print(json.dumps(story, indent=2))
            else:
                print(json.dumps(story))

            print("\n--- End of Story ---\n")

            continue



        # ✅ ===== VALIDATE + METRICS =====
        if line.lower() == "/validate":
            print("\n--- Running Validation ---")

            nodes = story["nodes"]
            node_map = {n["nodeId"]: n for n in nodes}

            errors = []
            warnings = []

            total_choices = 0
            total_endings = 0

            # ===== CHECK LINKS + STRUCTURE =====
            for node in nodes:
                node_id = node["nodeId"]

                has_next = "nextNodeId" in node
                has_choices = "choices" in node
                has_command = "command" in node

                # ✅ nextNodeId check
                if has_next:
                    if node["nextNodeId"] not in node_map:
                        errors.append(
                            f"{node_id} → missing nextNodeId '{node['nextNodeId']}'"
                        )

                # ✅ choices check
                if has_choices:
                    if len(node["choices"]) > 0:
                        total_choices += len(node["choices"])

                        for choice in node["choices"]:
                            nxt = choice.get("nextNodeId")
                            if not nxt or nxt not in node_map:
                                errors.append(
                                    f"{node_id} → invalid choice target '{nxt}'"
                                )
                    else:
                        # empty choices array = ending
                        total_endings += 1

                # ✅ dead node warning
                if not has_next and not has_choices and not has_command:
                    warnings.append(f"{node_id} has no nextNodeId, choices, or command")

            # ===== TRAVERSE REACHABLE =====
            visited = set()

            def traverse(node_id):
                if node_id in visited:
                    return
                visited.add(node_id)

                node = node_map.get(node_id)
                if not node:
                    return

                if "nextNodeId" in node:
                    traverse(node["nextNodeId"])

                if "choices" in node:
                    for c in node["choices"]:
                        traverse(c["nextNodeId"])

            if nodes:
                start_id = nodes[0]["nodeId"]
                traverse(start_id)

            unreachable = []

            for node_id in node_map:
                if node_id not in visited:
                    warnings.append(f"{node_id} is unreachable")
                    unreachable.append(node_id)

            # ===== METRICS =====
            total_nodes = len(nodes)
            reachable_nodes = len(visited)
            unreachable_nodes = len(unreachable)

            branching_factor = (
                total_choices / total_nodes if total_nodes > 0 else 0
            )

            # ===== PRINT RESULTS =====
            if not errors and not warnings:
                print("✅ No issues found!\n")
            else:
                if errors:
                    print("\n❌ Errors:")
                    for e in errors:
                        print(f"- {e}")

                if warnings:
                    print("\n⚠️ Warnings:")
                    for w in warnings:
                        print(f"- {w}")

            # ===== PRINT METRICS =====
            print("\n Story Metrics:")
            print(f"- Total Nodes: {total_nodes}")
            print(f"- Total Choices: {total_choices}")
            print(f"- Total Endings: {total_endings}")
            print(f"- Reachable Nodes: {reachable_nodes}")
            print(f"- Unreachable Nodes: {unreachable_nodes}")
            print(f"- Branching Factor: {branching_factor:.2f}")

            print("\n--- Validation Complete ---\n")

            continue


        # ✅ ===== PATH SIMULATION =====
        if line.lower() == "/simulate":
            print("\n--- Running Path Simulation ---")

            nodes = story["nodes"]
            node_map = {n["nodeId"]: n for n in nodes}

            if not nodes:
                print("No nodes to simulate.\n")
                continue

            total_paths = 0
            endings_reached = 0
            max_depth = 0
            loop_detected = False

            visited_in_path = set()

            def dfs(node_id, depth, path):
                nonlocal total_paths, endings_reached, max_depth, loop_detected

                # ✅ detect loop
                if node_id in path:
                    loop_detected = True
                    return

                path.add(node_id)

                node = node_map.get(node_id)
                if not node:
                    path.remove(node_id)
                    return

                max_depth = max(max_depth, depth)

                # ✅ ending node
                if "choices" in node and len(node["choices"]) == 0:
                    total_paths += 1
                    endings_reached += 1
                    path.remove(node_id)
                    return

                # ✅ branch
                if "choices" in node:
                    for choice in node["choices"]:
                        dfs(choice["nextNodeId"], depth + 1, path)

                # ✅ linear progression
                elif "nextNodeId" in node:
                    dfs(node["nextNodeId"], depth + 1, path)

                else:
                    # dead node
                    total_paths += 1
                    path.remove(node_id)
                    return

                path.remove(node_id)

            start_id = nodes[0]["nodeId"]
            dfs(start_id, 1, set())

            # ===== RESULTS =====
            print("\n📊 Simulation Results:")
            print(f"- Total Paths: {total_paths}")
            print(f"- Endings Reached: {endings_reached}")
            print(f"- Max Depth: {max_depth}")

            if loop_detected:
                print("⚠️ Loop detected in story!")

            print("\n--- Simulation Complete ---\n")

            continue


        # ✅ ===== NORMAL NODE CREATION =====

        # ===== COMMAND =====
        if line.startswith("command:"):
            parts = line.split(":", 2)

            if len(parts) < 2:
                print("Invalid command format.")
                continue

            node = {
                "nodeId": f"node_{node_counter}",
                "command": parts[1]
            }

            if parts[1] == "new_contact":
                if len(parts) < 3:
                    print("Missing contact name.")
                    continue
                node["contact_name"] = parts[2]

        # ===== NARRATOR =====
        elif line.lower().startswith("narrator:"):
            node = {
                "nodeId": f"node_{node_counter}",
                "narrator_text": line.split(":", 1)[1].strip()
            }

        # ===== NORMAL DIALOGUE =====
        else:
            if ":" not in line:
                print("Invalid format. Use Speaker: text")
                continue

            speaker, text = line.split(":", 1)

            speaker = speaker.strip()
            text = text.strip()

            if speaker.lower() == "sadit":
                speaker = "You"

            node = {
                "nodeId": f"node_{node_counter}",
                "speaker": speaker,
                "text": text
            }

        node_counter += 1
        current_override = None

        # ✅ link previous node
        if 'current_override' in locals() and current_override:
            prev_node = current_override
        else:
            prev_node = story["nodes"][-1] if story["nodes"] else None


        if prev_node:
            if "nextNodeId" not in prev_node and "choices" not in prev_node:
                prev_node["nextNodeId"] = node["nodeId"]

        # ✅ reset override after use
        if 'current_override' in locals():
            current_override = None

        story["nodes"].append(node)

        print(f"✅ Added node: {node['nodeId']}")

        save_data(data)


# ===== MAIN MENU =====
def main():
    data = load_data()

    while True:
        print("\nStory Manager")
        print("1. Create Story")
        print("2. List Stories")
        print("3. Edit Story")
        print("4. Exit")

        choice = input("\nSelect option: ")

        if choice == "1":
            create_story(data)

        elif choice == "2":
            list_stories(data)

        elif choice == "3":
            edit_story(data)

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("Invalid choice.\n")


if __name__ == "__main__":
    main()