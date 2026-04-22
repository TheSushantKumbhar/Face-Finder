import numpy as np


def normalize_embedding(embedding):
    vec = np.array(embedding)
    return (vec / np.linalg.norm(vec)).tolist()
