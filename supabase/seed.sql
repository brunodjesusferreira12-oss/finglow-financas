-- Rode este arquivo apenas se voce ja possui usuarios cadastrados
-- e quer semear os treinos padrao manualmente para eles.

select public.seed_default_workouts(id)
from public.profiles;
