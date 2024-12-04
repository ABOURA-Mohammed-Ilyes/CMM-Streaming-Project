import os
import json

def get_all_video_metadata(upload_folder, folder_name=None):
    video_metadata = []
    
    # Si un dossier spécifique est spécifié, l'utiliser
    folders = [folder_name] if folder_name else os.listdir(upload_folder)

    for name in folders:
        folder_path = os.path.join(upload_folder, name)
        
        if os.path.isdir(folder_path):
            # Vérifier la présence d'un fichier JSON dans le dossier
            json_file = f"{name}.json"
            json_path = os.path.join(folder_path, json_file)
            
            if os.path.exists(json_path):
                with open(json_path, 'r') as file:
                    video_info = json.load(file)
                    # Ajouter un format "auto" avec la résolution d'origine
                    height = video_info["height"]
                    video_info["available_resolutions"] = []
                    if height >= 1080:
                        video_info["available_resolutions"].extend(["240", "360", "480", "640", "720", "1080"])
                    elif height >= 720:
                        video_info["available_resolutions"].extend(["240", "360", "480", "640", "720"])
                    elif height >= 640:
                        video_info["available_resolutions"].extend(["240", "360", "480", "640"])
                    elif height >= 480:
                        video_info["available_resolutions"].extend(["240", "360", "480"])
                    elif height >= 360:
                        video_info["available_resolutions"].extend(["240", "360"])
                    elif height >= 240:
                        video_info["available_resolutions"].extend(["240"])
                        

                    video_metadata.append(video_info)

    return video_metadata
